import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import type { Track, Album, Artist } from '$lib/backends/types';

export const load = (async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { query: '', artists: [], albums: [], tracks: [] };

	const b = getBackendWithCapability(Capability.Search, locals.config.backends);
	if (!b?.search) return { query: q, artists: [], albums: [], tracks: [] };

	try {
		const result = await cached(`search:${q}`, 900, () => b.search!(q));
		return {
			query: q,
			artists: result.artists as Artist[],
			albums: result.albums as Album[],
			tracks: result.tracks as Track[]
		};
	} catch {
		return { query: q, artists: [], albums: [], tracks: [] };
	}
}) satisfies PageServerLoad;
