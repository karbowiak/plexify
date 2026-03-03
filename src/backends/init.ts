import { registerBackend, registerMetadataBackend } from "./registry"
import { plexBackend } from "./plex/definition"
import { demoBackend } from "./demo/definition"
import { lastfmMetadataBackend } from "./lastfm/definition"
import { deezerMetadataBackend } from "./deezer/definition"
import { appleMetadataBackend } from "./apple/definition"

registerBackend(plexBackend)
registerBackend(demoBackend)
registerMetadataBackend(lastfmMetadataBackend)
registerMetadataBackend(deezerMetadataBackend)
registerMetadataBackend(appleMetadataBackend)
