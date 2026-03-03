#![allow(dead_code)]

use serde::Serialize;

/// Metadata sent with play/preload commands
#[derive(Debug, Clone)]
pub struct TrackMeta {
    pub url: String,
    pub rating_key: i64,
    pub duration_ms: i64,
    pub part_id: i64,
    pub parent_key: String,
    pub track_index: i64,
    /// Track gain from Plex loudness analysis in dB (e.g. -14.1).
    /// None if the server hasn't analysed this track yet.
    pub gain_db: Option<f32>,
    /// When true, skip crossfade for this track (e.g. podcast episodes).
    pub skip_crossfade: bool,
}

/// Commands sent from the Tauri thread to the decoder thread
pub enum AudioCommand {
    Play(TrackMeta),
    Pause,
    Resume,
    Stop,
    Seek(i64),            // position in milliseconds
    SetVolume(f32),       // 0.0 - 1.0
    PreloadNext(TrackMeta),
    SetCrossfadeWindow(u64), // milliseconds; 0 = disabled
    SetCrossfadeStyle(u64),  // 0=Smooth, 1=DjFilter, 2=EchoOut, 3=HardCut
    SetNormalizationEnabled(bool), // enable/disable ReplayGain normalization
    SetEq { gains_db: [f32; 10] }, // recompute all 10 biquad coefficients
    SetEqEnabled(bool),            // enable/disable EQ bypass
    SetPreampGain(f32),            // pre-amp in dB (−12..+3); applied before EQ
    SetSameAlbumCrossfade(bool),   // when false (default), suppress crossfade for same-album tracks
    SetSmartCrossfade(bool),       // when true (default), use track analysis for adaptive crossfade
    SetVisualizerEnabled(bool),    // gate PCM IPC bridge for visualizer
    SetPreferredDevice(Option<String>), // preferred CPAL output device name (applied on next Play)
    SetEqPostgain(f32),                 // post-EQ makeup gain in dB (0..+18)
    SetEqPostgainAuto(bool),            // auto-compute postgain as 1/pregain
    SwapProducer(ringbuf::HeapProd<f32>), // replace the ring buffer producer (device switch)
    Shutdown,
}

impl std::fmt::Debug for AudioCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Play(m) => write!(f, "Play({})", m.rating_key),
            Self::Pause => write!(f, "Pause"),
            Self::Resume => write!(f, "Resume"),
            Self::Stop => write!(f, "Stop"),
            Self::Seek(ms) => write!(f, "Seek({ms})"),
            Self::SetVolume(v) => write!(f, "SetVolume({v})"),
            Self::PreloadNext(m) => write!(f, "PreloadNext({})", m.rating_key),
            Self::SetCrossfadeWindow(ms) => write!(f, "SetCrossfadeWindow({ms})"),
            Self::SetCrossfadeStyle(s) => write!(f, "SetCrossfadeStyle({s})"),
            Self::SetNormalizationEnabled(e) => write!(f, "SetNormalizationEnabled({e})"),
            Self::SetEq { .. } => write!(f, "SetEq"),
            Self::SetEqEnabled(e) => write!(f, "SetEqEnabled({e})"),
            Self::SetPreampGain(g) => write!(f, "SetPreampGain({g})"),
            Self::SetSameAlbumCrossfade(e) => write!(f, "SetSameAlbumCrossfade({e})"),
            Self::SetSmartCrossfade(e) => write!(f, "SetSmartCrossfade({e})"),
            Self::SetVisualizerEnabled(e) => write!(f, "SetVisualizerEnabled({e})"),
            Self::SetPreferredDevice(n) => write!(f, "SetPreferredDevice({n:?})"),
            Self::SetEqPostgain(g) => write!(f, "SetEqPostgain({g})"),
            Self::SetEqPostgainAuto(a) => write!(f, "SetEqPostgainAuto({a})"),
            Self::SwapProducer(_) => write!(f, "SwapProducer"),
            Self::Shutdown => write!(f, "Shutdown"),
        }
    }
}

/// Events emitted from the audio engine back to the frontend
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum AudioEvent {
    Position {
        position_ms: i64,
        duration_ms: i64,
    },
    TrackStarted {
        rating_key: i64,
        duration_ms: i64,
    },
    TrackEnded {
        rating_key: i64,
    },
    State {
        state: PlaybackState,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PlaybackState {
    Playing,
    Paused,
    Buffering,
    Stopped,
}

/// Crossfade mixing style — determines how two tracks are blended during a transition.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CrossfadeStyle {
    /// Equal-power cos/sin curves — clean, safe default.
    Smooth = 0,
    /// LP sweep out + HP sweep in + S-curve volume — classic club DJ blend.
    DjFilter = 1,
    /// Beat-synced delay with decaying feedback on the outgoing track.
    EchoOut = 2,
    /// Beat-aligned ~50ms micro-crossfade — instant switch like a live DJ drop.
    HardCut = 3,
}

impl CrossfadeStyle {
    pub fn from_u64(v: u64) -> Self {
        match v {
            1 => Self::DjFilter,
            2 => Self::EchoOut,
            3 => Self::HardCut,
            _ => Self::Smooth,
        }
    }
}

/// Audio format info extracted from symphonia after probing
#[derive(Debug, Clone)]
pub struct AudioFormat {
    pub sample_rate: u32,
    pub channels: u32,
    pub codec: String,
}
