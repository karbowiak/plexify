/**
 * Demo backend image URL assembly.
 *
 * Wraps Deezer CDN URLs in the semantic `image://` scheme.
 */

import { buildImageUrl } from "../../lib/imageUrl"

type EntityType = "artist" | "album" | "track" | "playlist"

export function buildDemoImageUrl(
  entityType: EntityType,
  entityId: string,
  cdnUrl: string | null | undefined,
  name?: string | null,
  artist?: string | null,
): string | null {
  if (!cdnUrl) return null
  return buildImageUrl(entityType, entityId, cdnUrl, name, artist)
}
