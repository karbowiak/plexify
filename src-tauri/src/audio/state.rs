#![allow(dead_code)]

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicI64, AtomicU64, Ordering};
use std::sync::Mutex;

use symphonia::core::audio::SampleBuffer;
use symphonia::core::formats::FormatReader;

use super::eq::{BiquadCoeffs, BiquadState};
use super::resampler::SincResampler;
use super::types::{CrossfadeStyle, TrackMeta};

// ---------------------------------------------------------------------------
// DecoderShared
// ---------------------------------------------------------------------------

/// Shared state between decoder thread and output callback
pub struct DecoderShared {
    /// Current playback position in samples (across all channels)
    pub position_samples: AtomicI64,
    /// Sample rate of current track
    pub sample_rate: AtomicI64,
    /// Number of channels
    pub channels: AtomicI64,
    /// Whether the decoder is paused
    pub paused: AtomicBool,
    /// Whether the decoder has finished the current track
    pub finished: AtomicBool,
    /// Volume (stored as fixed-point: value * 1000)
    pub volume_millths: AtomicI64,
    /// Output device sample rate (set once at startup by output.rs)
    pub device_sample_rate: AtomicI64,
    /// Directory for audio file cache (None = caching disabled)
    pub cache_dir: Option<PathBuf>,
    /// Maximum audio cache size in bytes (0 = unlimited)
    pub max_cache_bytes: AtomicU64,
    /// Set to true when a new Play command is received so the output callback
    /// can instantly drain stale samples from the previous track.
    pub flush_pending: AtomicBool,
    /// Set to true when a Seek command completes so the output callback drains
    /// the ring buffer of pre-seek audio.
    pub seek_flush_pending: AtomicBool,
    /// Crossfade window in milliseconds. 0 = disabled, default = 8000 ms.
    pub crossfade_window_ms: AtomicU64,
    /// BPM of the currently playing track (* 100 fixed-point; 0 = unknown)
    pub current_bpm: AtomicU64,
    /// BPM of the queued next track (* 100 fixed-point; 0 = unknown)
    pub next_bpm: AtomicU64,
    /// ReplayGain normalization gain for the current track (× 1000; 1000 = 1.0 linear)
    pub normalization_gain_millths: AtomicI64,
    /// ReplayGain normalization gain for the queued next track (× 1000)
    pub next_norm_gain_millths: AtomicI64,
    /// Whether ReplayGain normalization is applied (default: true)
    pub normalization_enabled: AtomicBool,
    /// Whether the EQ is active (default: false)
    pub eq_enabled: AtomicBool,
    /// Current EQ biquad coefficients — recomputed on SetEq, read once per output callback.
    pub eq_coeffs: Mutex<[BiquadCoeffs; 10]>,
    /// Last-set gains in fixed-point (×1000) for potential future recompute.
    pub eq_gains_millths: Mutex<[i32; 10]>,
    /// Sample rate used for the last coefficient computation.
    pub eq_sample_rate: AtomicI64,
    /// Pre-amp gain applied in the output callback before EQ (× 1000; 1000 = 1.0 = 0 dB).
    pub preamp_gain_millths: AtomicI64,
    /// Automatic gain reduction to compensate for EQ boost (× 1000; 1000 = 1.0 = 0 dB).
    pub eq_pregain_millths: AtomicI64,
    /// When false (default), crossfade is suppressed for consecutive same-album tracks.
    pub same_album_crossfade: AtomicBool,
    /// When true (default), crossfade uses track analysis to skip silence and adapt duration.
    pub smart_crossfade_enabled: AtomicBool,
    /// Gates the PCM IPC bridge — only emit audio://vis-frame when true.
    pub vis_enabled: AtomicBool,
    /// Channel sender for PCM data to the visualizer relay thread.
    pub vis_sender: Mutex<Option<crossbeam_channel::Sender<Vec<f32>>>>,
    /// Preferred CPAL output device name.
    pub preferred_device_name: Mutex<Option<String>>,
    /// Set to true after a seek so the output callback applies a fade-in ramp.
    pub seek_fadein_pending: AtomicBool,
    /// Set to true on Play/Seek to gate the output callback until the decoder
    /// has pushed enough samples into the ring buffer (prevents underrun pops).
    pub prebuffering: AtomicBool,
    /// Post-EQ makeup gain (× 1000; 1000 = 1.0 = 0 dB). Restores volume lost to eq_pregain.
    pub eq_postgain_millths: AtomicI64,
    /// When true, postgain is auto-computed as 1/pregain whenever EQ gains change.
    pub eq_postgain_auto: AtomicBool,
    /// The actual OS audio device currently in use (resolved from preferred or system default).
    pub current_device_name: Mutex<String>,
    /// Crossfade mixing style (0=Smooth, 1=DjFilter, 2=EchoOut, 3=HardCut).
    pub crossfade_style: AtomicU64,
    /// HTTP client configured by the active backend (e.g. Plex headers + auth).
    /// When set, the cache layer uses this instead of the bare default client.
    pub backend_http: Mutex<Option<reqwest::Client>>,
}

impl DecoderShared {
    pub fn new(cache_dir: Option<PathBuf>) -> Self {
        Self {
            position_samples: AtomicI64::new(0),
            sample_rate: AtomicI64::new(44100),
            channels: AtomicI64::new(2),
            paused: AtomicBool::new(false),
            finished: AtomicBool::new(false),
            volume_millths: AtomicI64::new(800),
            device_sample_rate: AtomicI64::new(44100),
            cache_dir,
            max_cache_bytes: AtomicU64::new(1_073_741_824),
            flush_pending: AtomicBool::new(false),
            seek_flush_pending: AtomicBool::new(false),
            crossfade_window_ms: AtomicU64::new(8_000),
            current_bpm: AtomicU64::new(0),
            next_bpm: AtomicU64::new(0),
            normalization_gain_millths: AtomicI64::new(1_000),
            next_norm_gain_millths: AtomicI64::new(1_000),
            normalization_enabled: AtomicBool::new(true),
            eq_enabled: AtomicBool::new(false),
            eq_coeffs: Mutex::new([BiquadCoeffs::identity(); 10]),
            eq_gains_millths: Mutex::new([0i32; 10]),
            eq_sample_rate: AtomicI64::new(44100),
            preamp_gain_millths: AtomicI64::new(1_000),
            eq_pregain_millths: AtomicI64::new(1_000),
            same_album_crossfade: AtomicBool::new(false),
            smart_crossfade_enabled: AtomicBool::new(true),
            vis_enabled: AtomicBool::new(false),
            vis_sender: Mutex::new(None),
            preferred_device_name: Mutex::new(None),
            seek_fadein_pending: AtomicBool::new(false),
            prebuffering: AtomicBool::new(false),
            eq_postgain_millths: AtomicI64::new(1_000),
            eq_postgain_auto: AtomicBool::new(true),
            current_device_name: Mutex::new(String::new()),
            crossfade_style: AtomicU64::new(0),
            backend_http: Mutex::new(None),
        }
    }

    pub fn position_ms(&self) -> i64 {
        let samples = self.position_samples.load(Ordering::Relaxed);
        let rate = self.sample_rate.load(Ordering::Relaxed);
        let channels = self.channels.load(Ordering::Relaxed);
        if rate == 0 || channels == 0 {
            return 0;
        }
        (samples / channels) * 1000 / rate
    }

    pub fn set_volume(&self, volume: f32) {
        let v = (volume.clamp(0.0, 1.0) * 1000.0) as i64;
        self.volume_millths.store(v, Ordering::Relaxed);
    }

    pub fn volume(&self) -> f32 {
        self.volume_millths.load(Ordering::Relaxed) as f32 / 1000.0
    }

    pub fn normalization_gain(&self) -> f32 {
        self.normalization_gain_millths.load(Ordering::Relaxed) as f32 / 1_000.0
    }

    /// Return the backend-configured HTTP client, or fall back to the bare
    /// default audio client (no backend-specific headers).
    pub fn http_client(&self) -> reqwest::Client {
        self.backend_http
            .lock()
            .ok()
            .and_then(|g| g.clone())
            .unwrap_or_else(|| super::cache::AUDIO_HTTP.clone())
    }
}

// ---------------------------------------------------------------------------
// EchoDelayBuffer
// ---------------------------------------------------------------------------

/// Ring buffer sized to one beat period for echo-out crossfade effect.
/// Stores stereo (or N-channel) interleaved samples.
pub struct EchoDelayBuffer {
    buf: Vec<f32>,
    write_pos: usize,
    channels: usize,
}

impl EchoDelayBuffer {
    /// Create a new echo buffer sized for one beat at the given BPM and sample rate.
    /// `channels` is the number of interleaved channels.
    pub fn new(bpm: f64, sample_rate: u32, channels: usize) -> Self {
        let beat_samples = ((60.0 / bpm) * sample_rate as f64) as usize;
        let buf_len = beat_samples * channels;
        Self {
            buf: vec![0.0; buf_len],
            write_pos: 0,
            channels,
        }
    }

    /// Process a single frame (all channels), adding the input to the buffer
    /// and returning the delayed output mixed with feedback.
    /// `feedback` controls how much of the delayed signal is fed back (0.0–1.0).
    #[inline]
    pub fn process_frame(&mut self, input: &[f32], feedback: f32) -> [f32; 8] {
        let ch = self.channels.min(8);
        let mut out = [0.0f32; 8];
        for c in 0..ch {
            let idx = self.write_pos + c;
            let delayed = self.buf[idx];
            out[c] = delayed;
            self.buf[idx] = input.get(c).copied().unwrap_or(0.0) + delayed * feedback;
        }
        self.write_pos = (self.write_pos + self.channels) % self.buf.len();
        out
    }
}

// ---------------------------------------------------------------------------
// CrossfadeState
// ---------------------------------------------------------------------------

/// Holds the decoder for the *next* track while it is being mixed in during a
/// crossfade transition.
pub struct CrossfadeState {
    pub format_reader: Box<dyn FormatReader>,
    pub decoder: Box<dyn symphonia::core::codecs::Decoder>,
    pub track_id: u32,
    pub sample_rate: u32,
    pub channels: u32,
    pub meta: TrackMeta,
    pub sample_buf: Option<SampleBuffer<f32>>,
    /// How many output frames have been mixed so far
    pub elapsed_frames: usize,
    /// Total frames to crossfade over (in *device-rate* frames)
    pub total_frames: usize,
    /// Decoded + resampled (to device rate) samples not yet consumed by the mixing loop.
    pub pending: Vec<f32>,
    /// ReplayGain linear gain for the next track (1.0 = no change)
    pub norm_gain: f32,
    /// Crossfade mixing style — snapshot at crossfade start.
    pub style: CrossfadeStyle,
    /// DJ Filter: current low-pass coefficients (sweep out on old track)
    pub lp_coeffs: BiquadCoeffs,
    /// DJ Filter: current high-pass coefficients (sweep in on new track)
    pub hp_coeffs: BiquadCoeffs,
    /// DJ Filter: per-channel biquad state for LP (max 8 channels)
    pub lp_state: [BiquadState; 8],
    /// DJ Filter: per-channel biquad state for HP (max 8 channels)
    pub hp_state: [BiquadState; 8],
    /// Echo Out: delay buffer for the outgoing track
    pub echo_buffer: Option<EchoDelayBuffer>,
}

// ---------------------------------------------------------------------------
// DecoderState
// ---------------------------------------------------------------------------

/// Groups all mutable state owned by the decoder thread, reducing the parameter
/// count of `handle_command` from 14 to a single `&mut DecoderState`.
pub struct DecoderState {
    pub current_track: Option<TrackMeta>,
    pub format_reader: Option<Box<dyn FormatReader>>,
    pub decoder: Option<Box<dyn symphonia::core::codecs::Decoder>>,
    pub current_track_id: u32,
    pub sample_buf: Option<SampleBuffer<f32>>,
    pub next_meta: Option<TrackMeta>,
    pub crossfade: Option<CrossfadeState>,
    pub fade_in_remaining: usize,
    pub fade_in_total: usize,
    /// Persistent sinc resampler for the current track's rate conversion.
    /// Keyed by (in_rate, out_rate, channels) — recreated when these change.
    pub resampler: Option<SincResampler>,
}

impl DecoderState {
    pub fn new() -> Self {
        Self {
            current_track: None,
            format_reader: None,
            decoder: None,
            current_track_id: 0,
            sample_buf: None,
            next_meta: None,
            crossfade: None,
            fade_in_remaining: 0,
            fade_in_total: 0,
            resampler: None,
        }
    }
}
