import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.Tracks, locals.config.backends);
	if (!b?.getLikedTracks) return { tracks: [] };

	try {
		const tracks = await cached('liked:tracks', 3600, () => b.getLikedTracks!());
		return { tracks };
	} catch {
		return { tracks: [] };
	}
}) satisfies PageServerLoad;
