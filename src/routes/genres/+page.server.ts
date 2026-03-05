import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.Tags, locals.config.backends);
	if (!b?.getTags) return { genres: [] };
	const genres = await cached('genres', 86400, () => b.getTags!('genre'));
	return { genres };
}) satisfies PageServerLoad;
