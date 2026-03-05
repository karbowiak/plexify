import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import { error } from '@sveltejs/kit';
import { fetchAndParseFeed } from '$lib/plugins/podcast-index/feedParser';

export const load = (async ({ params, locals }) => {
	let feedUrl: string;
	try {
		feedUrl = atob(params.id ?? '');
	} catch {
		error(400, 'Invalid podcast ID');
	}

	if (!feedUrl) error(400, 'Missing feed URL');

	const b = getBackendWithCapability(Capability.Podcasts, locals.config.backends);
	if (!b) error(500, 'No podcast backend available');

	try {
		const detail = await cached(`podcast:feed:${feedUrl}`, 1800, () => fetchAndParseFeed(feedUrl));
		return { detail, feedUrl };
	} catch (e: any) {
		if (e.status) throw e;
		error(500, e instanceof Error ? e.message : 'Failed to load podcast feed');
	}
}) satisfies PageServerLoad;
