import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const backends = locals.config.backends;

	const artistBackend = getBackendWithCapability(Capability.Artists, backends);
	const albumBackend = getBackendWithCapability(Capability.Albums, backends);
	const trackBackend = getBackendWithCapability(Capability.Tracks, backends);

	const [likedArtists, likedAlbums, likedTracks] = await Promise.all([
		artistBackend?.getLikedArtists
			? cached('library:liked:artists', 3600, () => artistBackend.getLikedArtists!(20)).catch(() => [])
			: [],
		albumBackend?.getLikedAlbums
			? cached('library:liked:albums', 3600, () => albumBackend.getLikedAlbums!(20)).catch(() => [])
			: [],
		trackBackend?.getLikedTracks
			? cached('library:liked:tracks', 3600, () => trackBackend.getLikedTracks!(10)).catch(() => [])
			: []
	]);

	return {
		likedArtists,
		likedAlbums,
		likedTracks,
		hasArtists: !!artistBackend,
		hasAlbums: !!albumBackend,
		hasTracks: !!trackBackend
	};
}) satisfies PageServerLoad;
