import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import type { Podcast, PodcastCategory } from '$lib/backends/types';
import { podcastApiFetch } from '$lib/plugins/podcast-index/auth';

// Server-side podcast helpers that call PodcastIndex directly
interface RawFeed {
	id: number;
	title: string;
	author: string;
	description: string;
	artwork: string;
	url: string;
	categories: Record<string, string>;
	language: string;
	episodeCount: number;
}

function transformFeed(raw: RawFeed): Podcast {
	return {
		id: raw.id,
		title: raw.title || '',
		author: raw.author || '',
		description: raw.description || '',
		artwork_url: raw.artwork || '',
		feed_url: raw.url || '',
		categories: raw.categories || {},
		language: raw.language || '',
		episode_count: raw.episodeCount || 0
	};
}

async function serverTrending(max: number, category?: string): Promise<Podcast[]> {
	const q = new URLSearchParams({ max: String(max), lang: 'en' });
	if (category) q.set('cat', category);
	const res = await podcastApiFetch(`podcasts/trending?${q}`);
	if (!res.ok) return [];
	const data = await res.json();
	return (data.feeds ?? []).map(transformFeed);
}

async function serverCategories(): Promise<PodcastCategory[]> {
	const res = await podcastApiFetch('categories/list');
	if (!res.ok) return [];
	const data = await res.json();
	return (data.feeds ?? []).map((f: { id: number; name: string }) => ({
		id: f.id,
		name: f.name
	}));
}

export const load = (async ({ url, locals }) => {
	const b = getBackendWithCapability(Capability.Podcasts, locals.config.backends);
	if (!b) return { trending: [], categories: [], selectedCategory: null, categoryResults: [] };

	const selectedCategory = url.searchParams.get('cat');

	const [trending, categories] = await Promise.all([
		cached<Podcast[]>('podcast:trending', 3600, () => serverTrending(15)).catch(() => []),
		cached<PodcastCategory[]>('podcast:categories', 86400, () => serverCategories()).catch(() => [])
	]);

	let categoryResults: Podcast[] = [];
	if (selectedCategory) {
		categoryResults = await cached<Podcast[]>(
			`podcast:trending:${selectedCategory}`,
			3600,
			() => serverTrending(30, selectedCategory)
		).catch(() => []);
	}

	return { trending, categories, selectedCategory, categoryResults };
}) satisfies PageServerLoad;
