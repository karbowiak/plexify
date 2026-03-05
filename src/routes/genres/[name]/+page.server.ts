import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ params, locals }) => {
	const name = decodeURIComponent(params.name ?? '');
	if (!name) return { name: '', artists: [], albums: [] };

	const b = getBackendWithCapability(Capability.Tags, locals.config.backends);
	if (!b?.getTagItems) return { name, artists: [], albums: [] };

	const result = await cached(`genre:${name}`, 3600, () => b.getTagItems!(name));
	return { name, artists: result.artists, albums: result.albums };
}) satisfies PageServerLoad;
