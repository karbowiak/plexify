import type { PageServerLoad } from './$types';

export const load = (async ({ params, fetch }) => {
	const cacheId = params.id ?? 'image';

	let stats = null;
	try {
		const res = await fetch(`/api/cache/${cacheId}/stats`);
		if (res.ok) stats = await res.json();
	} catch { /* ignore */ }

	return { cacheId, initialStats: stats };
}) satisfies PageServerLoad;
