#![allow(dead_code)]

use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::thread;

use crossbeam_channel::{bounded, Receiver, Sender};
use ringbuf::traits::Split;
use ringbuf::HeapRb;
use tauri::{AppHandle, Emitter};
use tracing::info;

use super::decoder::{decoder_thread, DecoderShared};
use super::output::{start_output, RING_BUFFER_SIZE};
use super::types::{AudioCommand, AudioEvent, PlaybackState};

/// The audio engine state managed by Tauri
pub struct AudioEngine {
    cmd_tx: Sender<AudioCommand>,
    shared: Arc<DecoderShared>,
}

impl AudioEngine {
    /// Create and start the audio engine.
    /// Spawns the decoder thread, starts the cpal output, and begins the event emitter.
    pub fn start(app_handle: AppHandle) -> Result<Self, String> {
        let (cmd_tx, cmd_rx) = bounded::<AudioCommand>(32);
        let (event_tx, event_rx) = bounded::<AudioEvent>(128);

        let shared = Arc::new(DecoderShared::new());

        // Create ring buffer (SPSC)
        let rb = HeapRb::<f32>::new(RING_BUFFER_SIZE);
        let (producer, consumer) = rb.split();

        // Start cpal output
        let shared_for_output = Arc::clone(&shared);
        let (_stream, device_sample_rate) = start_output(consumer, shared_for_output)?;

        // Store device sample rate so the decoder can resample to match
        shared
            .device_sample_rate
            .store(device_sample_rate as i64, Ordering::Relaxed);

        // We need to keep the stream alive — leak it into a static.
        // cpal drops the stream (and stops audio) when the Stream is dropped.
        // This is fine because the audio engine lives for the app lifetime.
        let stream = Box::new(_stream);
        std::mem::forget(stream);

        info!(
            device_sample_rate = device_sample_rate,
            "Audio output started"
        );

        // Spawn decoder thread
        let shared_for_decoder = Arc::clone(&shared);
        thread::Builder::new()
            .name("audio-decode".into())
            .spawn(move || {
                decoder_thread(cmd_rx, event_tx, producer, shared_for_decoder);
            })
            .map_err(|e| format!("Failed to spawn decoder thread: {e}"))?;

        // Spawn event emitter — forwards AudioEvents to Tauri frontend
        let shared_for_events = Arc::clone(&shared);
        Self::spawn_event_emitter(app_handle, event_rx, shared_for_events);

        Ok(Self { cmd_tx, shared })
    }

    /// Send a command to the audio engine
    pub fn send(&self, cmd: AudioCommand) -> Result<(), String> {
        self.cmd_tx
            .send(cmd)
            .map_err(|e| format!("Failed to send audio command: {e}"))
    }

    /// Get current playback position in milliseconds
    pub fn position_ms(&self) -> i64 {
        self.shared.position_ms()
    }

    /// Check if playback is paused
    pub fn is_paused(&self) -> bool {
        self.shared.paused.load(Ordering::Relaxed)
    }

    /// Check if current track has finished
    pub fn is_finished(&self) -> bool {
        self.shared.finished.load(Ordering::Relaxed)
    }

    /// Spawn the event emitter task that bridges AudioEvents to Tauri events.
    /// Also emits periodic position updates.
    fn spawn_event_emitter(
        app_handle: AppHandle,
        event_rx: Receiver<AudioEvent>,
        shared: Arc<DecoderShared>,
    ) {
        thread::Builder::new()
            .name("audio-events".into())
            .spawn(move || {
                let mut last_state = PlaybackState::Stopped;
                let mut last_position_emit = std::time::Instant::now();
                let mut current_duration_ms: i64 = 0;
                let mut _current_rating_key: i64 = 0;

                loop {
                    // Try to receive events with a 50ms timeout
                    // This allows us to emit position updates even when no events come in
                    match event_rx.recv_timeout(std::time::Duration::from_millis(50)) {
                        Ok(event) => {
                            match &event {
                                AudioEvent::TrackStarted { rating_key, duration_ms } => {
                                    _current_rating_key = *rating_key;
                                    current_duration_ms = *duration_ms;
                                    last_state = PlaybackState::Playing;
                                    let _ = app_handle.emit("audio://track-started", &event);
                                }
                                AudioEvent::TrackEnded { .. } => {
                                    last_state = PlaybackState::Stopped;
                                    let _ = app_handle.emit("audio://track-ended", &event);
                                }
                                AudioEvent::State { state } => {
                                    last_state = *state;
                                    let _ = app_handle.emit("audio://state", &event);
                                }
                                AudioEvent::Error { .. } => {
                                    let _ = app_handle.emit("audio://error", &event);
                                }
                                AudioEvent::Position { .. } => {
                                    // Position events from the emitter itself (see below)
                                    let _ = app_handle.emit("audio://position", &event);
                                }
                            }
                        }
                        Err(crossbeam_channel::RecvTimeoutError::Timeout) => {
                            // Normal — just continue to emit position
                        }
                        Err(crossbeam_channel::RecvTimeoutError::Disconnected) => {
                            info!("Event channel disconnected, event emitter exiting");
                            return;
                        }
                    }

                    // Emit position updates every ~250ms when playing
                    if last_state == PlaybackState::Playing
                        && last_position_emit.elapsed() >= std::time::Duration::from_millis(250)
                    {
                        let pos = shared.position_ms();
                        let _ = app_handle.emit(
                            "audio://position",
                            &AudioEvent::Position {
                                position_ms: pos,
                                duration_ms: current_duration_ms,
                            },
                        );
                        last_position_emit = std::time::Instant::now();
                    }
                }
            })
            .expect("Failed to spawn event emitter thread");
    }

    /// Set the duration for position reporting (called when a new track starts)
    pub fn set_current_duration(&self, _duration_ms: i64) {
        // Duration is tracked in the event emitter via TrackStarted events
        // For now this is a no-op; duration comes from the frontend
    }
}

impl Drop for AudioEngine {
    fn drop(&mut self) {
        let _ = self.cmd_tx.send(AudioCommand::Shutdown);
    }
}
