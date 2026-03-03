/**
 * TypeScript wrappers around Tauri invoke() calls for the Rust audio engine.
 * These are provider-agnostic — they operate on raw URLs and engine parameters.
 */

import { invoke } from "@tauri-apps/api/core"

/** Start playing a track via the Rust audio engine. */
export function audioPlay(
  url: string,
  ratingKey: number,
  durationMs: number,
  partId: number,
  parentKey: string,
  trackIndex: number,
  gainDb: number | null,
): Promise<void> {
  return invoke("audio_play", { url, ratingKey, durationMs, partId, parentKey, trackIndex, gainDb })
}

/** Pause audio playback. */
export function audioPause(): Promise<void> {
  return invoke("audio_pause")
}

/** Resume audio playback. */
export function audioResume(): Promise<void> {
  return invoke("audio_resume")
}

/** Stop audio playback and clear the current track. */
export function audioStop(): Promise<void> {
  return invoke("audio_stop")
}

/** Seek to a position in the current track. */
export function audioSeek(positionMs: number): Promise<void> {
  return invoke("audio_seek", { positionMs: Math.round(positionMs) })
}

/** Set the playback volume (0.0 - 1.0). */
export function audioSetVolume(volume: number): Promise<void> {
  return invoke("audio_set_volume", { volume })
}

/** Pre-buffer the next track for gapless playback. */
export function audioPreloadNext(
  url: string,
  ratingKey: number,
  durationMs: number,
  partId: number,
  parentKey: string,
  trackIndex: number,
  gainDb: number | null,
): Promise<void> {
  return invoke("audio_preload_next", { url, ratingKey, durationMs, partId, parentKey, trackIndex, gainDb })
}

/** Warm the audio disk cache for a URL in the background. Returns immediately. */
export function audioPrefetch(url: string): Promise<void> {
  return invoke("audio_prefetch", { url })
}

/** Get current audio cache usage: bytes used and file count. */
export function audioCacheInfo(): Promise<{ size_bytes: number; file_count: number }> {
  return invoke("audio_cache_info")
}

/** Delete all audio cache files from disk. */
export function audioClearCache(): Promise<void> {
  return invoke("audio_clear_cache")
}

/** Set the maximum audio cache size in bytes. Pass 0 for unlimited. */
export function audioSetCacheMaxBytes(maxBytes: number): Promise<void> {
  return invoke("audio_set_cache_max_bytes", { maxBytes })
}

/**
 * Set the crossfade window duration in milliseconds.
 * Pass 0 to disable crossfade entirely. Default is 8000 ms (8 s).
 * Maximum recommended value is 30000 ms (30 s).
 */
export function audioSetCrossfadeWindow(ms: number): Promise<void> {
  return invoke("audio_set_crossfade_window", { ms })
}

/**
 * Enable or disable ReplayGain audio normalization.
 * When enabled (default), tracks are volume-levelled using embedded REPLAYGAIN_TRACK_GAIN tags.
 */
export function audioSetNormalizationEnabled(enabled: boolean): Promise<void> {
  return invoke("audio_set_normalization_enabled", { enabled })
}

/**
 * Set all 10 EQ band gains in dB (±12 dB per band).
 * Index order: 32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000 Hz.
 */
export function audioSetEq(gainsDb: [number, number, number, number, number, number, number, number, number, number]): Promise<void> {
  return invoke("audio_set_eq", { gainsDb })
}

/**
 * Enable or disable the 10-band graphic EQ.
 * When disabled, all EQ processing is bypassed with zero CPU cost.
 */
export function audioSetEqEnabled(enabled: boolean): Promise<void> {
  return invoke("audio_set_eq_enabled", { enabled })
}

/**
 * Set the pre-amp gain in dB (range −12..+3, default 0).
 * Applied before EQ; use to recover headroom after large EQ boosts.
 */
export function audioSetPreampGain(db: number): Promise<void> {
  return invoke("audio_set_preamp_gain", { db })
}

/** Set post-EQ makeup gain in dB (0..+18). Restores volume lost to pregain. */
export function audioSetEqPostgain(db: number): Promise<void> {
  return invoke("audio_set_eq_postgain", { db })
}

/** Enable or disable automatic post-EQ makeup gain (postgain = 1/pregain). */
export function audioSetEqPostgainAuto(autoMode: boolean): Promise<void> {
  return invoke("audio_set_eq_postgain_auto", { autoMode })
}

/** Get the name of the actual OS audio device currently in use. */
export function audioGetCurrentDevice(): Promise<string> {
  return invoke("audio_get_current_device")
}

/**
 * Enable or disable crossfade for consecutive same-album tracks.
 * When disabled (default), same-album tracks play gaplessly without fading.
 */
export function audioSetSameAlbumCrossfade(enabled: boolean): Promise<void> {
  return invoke("audio_set_same_album_crossfade", { enabled })
}

/** List available audio output device names for the default CPAL host. */
export function audioGetOutputDevices(): Promise<string[]> {
  return invoke("audio_get_output_devices")
}

/** Set the preferred audio output device by name. Pass null for system default. */
export function audioSetOutputDevice(name: string | null): Promise<void> {
  return invoke("audio_set_output_device", { name })
}

/** Track analysis results from the Rust audio engine. */
export interface TrackAnalysis {
  rating_key: number
  audio_start_ms: number
  audio_end_ms: number
  outro_start_ms: number
  intro_end_ms: number
  median_energy: number
  bpm: number
}

/** Get the track analysis for a given rating key. Returns null if not yet analysed. */
export function audioGetTrackAnalysis(ratingKey: number): Promise<TrackAnalysis | null> {
  return invoke("audio_get_track_analysis", { ratingKey })
}

/** Trigger background analysis for a lookahead track. Fire-and-forget. */
export function audioAnalyzeTrack(url: string, ratingKey: number, durationMs: number): Promise<void> {
  return invoke("audio_analyze_track", { url, ratingKey, durationMs })
}

/** Enable or disable smart crossfade (adaptive timing based on track analysis). */
export function audioSetSmartCrossfade(enabled: boolean): Promise<void> {
  return invoke("audio_set_smart_crossfade", { enabled })
}

/**
 * Set the crossfade mixing style.
 * 0 = Smooth, 1 = DJ Filter, 2 = Echo Out, 3 = Hard Cut.
 */
export function audioSetCrossfadeStyle(style: number): Promise<void> {
  return invoke("audio_set_crossfade_style", { style })
}

/** Enable or disable the PCM IPC bridge for the visualizer. */
export function audioSetVisualizerEnabled(enabled: boolean): Promise<void> {
  return invoke("audio_set_visualizer_enabled", { enabled })
}
