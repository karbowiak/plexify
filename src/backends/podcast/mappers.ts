/**
 * Episode → MusicTrack mapper.
 *
 * Maps podcast episodes to MusicTrack objects so they can be played
 * through the existing audio engine and player store.
 */

import type { MusicTrack } from "../../types/music"
import type { PodcastEpisode } from "./api"

/** Simple string hash for generating stable numeric-like IDs. */
function hashStr(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

/** Map a podcast episode to a MusicTrack for playback. */
export function episodeToTrack(
  episode: PodcastEpisode,
  podcastTitle: string,
  podcastAuthor: string,
  podcastArtworkUrl: string,
): MusicTrack {
  return {
    id: `pod-${hashStr(episode.guid || episode.title)}`,
    title: episode.title,
    trackNumber: episode.episode_number ?? 0,
    duration: episode.duration_secs * 1000, // ms
    albumId: null,
    albumName: podcastTitle,
    albumYear: null,
    artistId: null,
    artistName: podcastAuthor,
    year: 0,
    playCount: 0,
    thumbUrl: episode.artwork_url ?? podcastArtworkUrl ?? null,
    albumThumbUrl: podcastArtworkUrl ?? null,
    artistThumbUrl: null,
    summary: episode.description || null,
    userRating: null,
    addedAt: episode.pub_date || null,
    lastPlayedAt: null,
    guid: episode.guid || null,
    codec: episode.audio_type || null,
    bitrate: null,
    channels: null,
    bitDepth: null,
    samplingRate: null,
    streamUrl: episode.audio_url || null,
    gain: null,
    albumGain: null,
    peak: null,
    loudness: null,
    _providerData: {
      feedUrl: "",  // Set by caller
      episodeGuid: episode.guid,
      isPodcast: true,
    },
  }
}

/** Map multiple episodes, setting the feedUrl on provider data. */
export function episodesToTracks(
  episodes: PodcastEpisode[],
  feedUrl: string,
  podcastTitle: string,
  podcastAuthor: string,
  podcastArtworkUrl: string,
): MusicTrack[] {
  return episodes
    .filter(ep => ep.audio_url) // only episodes with audio
    .map(ep => {
      const track = episodeToTrack(ep, podcastTitle, podcastAuthor, podcastArtworkUrl)
      if (track._providerData && typeof track._providerData === "object") {
        ;(track._providerData as Record<string, unknown>).feedUrl = feedUrl
      }
      return track
    })
}

/** Check if a MusicTrack is a podcast episode. */
export function isPodcastTrack(track: MusicTrack): boolean {
  const pd = track._providerData as Record<string, unknown> | undefined
  return pd?.isPodcast === true
}
