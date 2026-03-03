/**
 * Map Deezer API types to generic MusicTrack/Album/Artist types.
 * Images go through image:// for disk caching with semantic entity paths.
 */

import type { DzTrack, DzAlbum, DzArtist } from "./types"
import type { MusicTrack, MusicAlbum, MusicArtist } from "../../types/music"
import { buildDemoImageUrl } from "./imageUrl"

function formatType(recordType: string | undefined): string | null {
  if (!recordType) return null
  const map: Record<string, string> = {
    single: "Single",
    ep: "EP",
    compile: "Compilation",
  }
  return map[recordType] ?? null
}

export function dzTrackToMusicTrack(t: DzTrack): MusicTrack {
  const trackId = `dz-${t.id}`
  const albumId = t.album ? `dz-${t.album.id}` : null
  const artistId = t.artist ? `dz-${t.artist.id}` : null
  return {
    id: trackId,
    title: t.title,
    trackNumber: t.track_position ?? 0,
    duration: t.duration * 1000, // seconds → ms
    albumId,
    albumName: t.album?.title ?? "",
    albumYear: null,
    artistId,
    artistName: t.artist?.name ?? "",
    year: 0,
    playCount: 0,
    thumbUrl: buildDemoImageUrl("track", trackId, t.album?.cover_big ?? t.album?.cover_medium, t.title, t.artist?.name),
    albumThumbUrl: buildDemoImageUrl("album", albumId ?? trackId, t.album?.cover_big ?? t.album?.cover_medium, t.album?.title, t.artist?.name),
    artistThumbUrl: buildDemoImageUrl("artist", artistId ?? trackId, t.artist?.picture_big ?? t.artist?.picture_medium, t.artist?.name),
    summary: null,
    userRating: null,
    addedAt: null,
    lastPlayedAt: null,
    guid: null,
    codec: "mp3",
    bitrate: 128,
    channels: 2,
    bitDepth: null,
    samplingRate: 44100,
    streamUrl: null,
    gain: null,
    albumGain: null,
    peak: null,
    loudness: null,
    mediaInfo: { container: "mp3", hasAudioStream: !!t.preview },
    _providerData: { preview: t.preview, dzId: t.id },
  }
}

export function dzAlbumToMusicAlbum(a: DzAlbum): MusicAlbum {
  const year = a.release_date ? parseInt(a.release_date.split("-")[0], 10) : 0
  const albumId = `dz-${a.id}`
  const artistId = a.artist ? `dz-${a.artist.id}` : null
  return {
    id: albumId,
    title: a.title,
    artistId,
    artistName: a.artist?.name ?? "",
    year: isNaN(year) ? 0 : year,
    trackCount: a.nb_tracks ?? 0,
    studio: a.label ?? null,
    thumbUrl: buildDemoImageUrl("album", albumId, a.cover_big ?? a.cover_xl ?? a.cover_medium, a.title, a.artist?.name),
    artistThumbUrl: buildDemoImageUrl("artist", artistId ?? albumId, a.artist?.picture_big ?? a.artist?.picture_medium, a.artist?.name),
    summary: null,
    userRating: null,
    addedAt: null,
    guid: null,
    genres: a.genres?.data?.map(g => g.name) ?? [],
    styles: [],
    moods: [],
    labels: a.label ? [a.label] : [],
    format: formatType(a.record_type),
    _providerData: { dzId: a.id },
  }
}

export function dzArtistToMusicArtist(a: DzArtist): MusicArtist {
  const artistId = `dz-${a.id}`
  return {
    id: artistId,
    title: a.name,
    thumbUrl: buildDemoImageUrl("artist", artistId, a.picture_big ?? a.picture_xl ?? a.picture_medium, a.name),
    artUrl: buildDemoImageUrl("artist", artistId, a.picture_xl ?? a.picture_big, a.name),
    summary: null,
    userRating: null,
    addedAt: null,
    guid: null,
    _providerData: { dzId: a.id, fanCount: a.nb_fan },
  }
}
