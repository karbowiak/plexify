import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.Artists, locals.config.backends);
	if (!b?.getLikedArtists) return { artists: [] };

	try {
		const artists = await cached('liked:artists', 3600, () => b.getLikedArtists!());
		return { artists };
	} catch {
		return { artists: [] };
	}
}) satisfies PageServerLoad;
