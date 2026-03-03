/**
 * TypeScript wrappers for the Tauri image cache commands.
 * Provider-agnostic — operates on the shared disk cache.
 */

import { invoke } from "@tauri-apps/api/core"

export interface ImageCacheInfo {
  files: number
  bytes: number
}

/** Delete all cached images from disk (unified imgcache/ dir + old migration dirs). */
export function clearImageCache(): Promise<void> {
  return invoke("clear_image_cache")
}

/** Returns file count and total size for the unified image cache. */
export function getImageCacheInfo(): Promise<ImageCacheInfo> {
  return invoke("get_image_cache_info")
}
