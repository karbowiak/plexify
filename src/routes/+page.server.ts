import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.Hubs, locals.config.backends);
	if (!b?.getHubs) return { hubs: [] };

	try {
		const hubs = await cached('hubs', 3600, () => b.getHubs!());
		return { hubs };
	} catch {
		return { hubs: [] };
	}
}) satisfies PageServerLoad;
