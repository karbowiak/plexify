import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.Albums, locals.config.backends);
	if (!b?.getLikedAlbums) return { albums: [] };

	try {
		const albums = await cached('liked:albums', 3600, () => b.getLikedAlbums!());
		return { albums };
	} catch {
		return { albums: [] };
	}
}) satisfies PageServerLoad;
