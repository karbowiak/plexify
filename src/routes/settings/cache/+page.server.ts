import type { PageServerLoad } from './$types';

const PROVIDERS = ['image', 'media', 'metadata', 'audio-analysis', 'api'] as const;

export const load = (async ({ fetch }) => {
	const stats = await Promise.all(
		PROVIDERS.map(async (id) => {
			try {
				const res = await fetch(`/api/cache/${id}/stats`);
				if (res.ok) {
					const data = await res.json();
					return { id, totalSizeBytes: data.totalSizeBytes, entryCount: data.entryCount };
				}
			} catch { /* ignore */ }
			return { id, totalSizeBytes: undefined, entryCount: undefined };
		})
	);

	return { providerStats: Object.fromEntries(stats.map((s) => [s.id, s])) };
}) satisfies PageServerLoad;
