/**
 * Thin HTML5 <audio> wrapper for internet radio streaming.
 * Imperative API — no React dependency. The existing Rust audio engine
 * downloads entire files before decoding, so it cannot handle infinite
 * radio streams. This uses the browser's native <audio> element instead.
 */

let _audio: HTMLAudioElement | null = null

/** Start playing an internet radio stream URL. */
export function radioPlay(url: string, volume: number): void {
  radioStop()
  _audio = new Audio()
  _audio.crossOrigin = "anonymous"
  _audio.volume = Math.max(0, Math.min(1, volume / 100))
  _audio.src = url
  _audio.play().catch(() => {})
}

/** Pause the current radio stream. */
export function radioPause(): void {
  _audio?.pause()
}

/** Resume the paused radio stream. */
export function radioResume(): void {
  _audio?.play().catch(() => {})
}

/** Stop and release the radio stream (frees network connection). */
export function radioStop(): void {
  if (_audio) {
    _audio.pause()
    _audio.removeAttribute("src")
    _audio.load()
    _audio = null
  }
}

/** Adjust volume (0–100 slider value). */
export function radioSetVolume(volume: number): void {
  if (_audio) {
    _audio.volume = Math.max(0, Math.min(1, Math.pow(volume / 100, 3)))
  }
}

export interface RadioAudioCallbacks {
  onPlaying?: () => void
  onWaiting?: () => void
  onError?: (msg: string) => void
  onPause?: () => void
}

/** Register event handlers on the current audio element. Returns an unlisten function. */
export function radioOnEvents(cb: RadioAudioCallbacks): () => void {
  if (!_audio) return () => {}
  const el = _audio

  const onPlaying = () => cb.onPlaying?.()
  const onWaiting = () => cb.onWaiting?.()
  const onError = () => cb.onError?.(el.error?.message ?? "Stream error")
  const onPause = () => cb.onPause?.()

  el.addEventListener("playing", onPlaying)
  el.addEventListener("waiting", onWaiting)
  el.addEventListener("error", onError)
  el.addEventListener("pause", onPause)

  return () => {
    el.removeEventListener("playing", onPlaying)
    el.removeEventListener("waiting", onWaiting)
    el.removeEventListener("error", onError)
    el.removeEventListener("pause", onPause)
  }
}
