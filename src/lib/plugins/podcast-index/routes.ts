import { json } from '@sveltejs/kit';
import type { PluginRoute } from '../router';
import { piHeaders, PI_BASE } from './auth';
import { parseFeed } from './feedParser';
import type { Podcast, PodcastCategory } from '$lib/backends/models/podcast';
import { apiCache } from '$lib/server/apiCache';

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

const search: PluginRoute = {
	method: 'GET',
	pattern: '/api/podcasts/search',
	handler: async ({ url }) => {
		const q = url.searchParams.get('q') ?? '';
		const max = url.searchParams.get('max') ?? '20';

		if (!q.trim()) return json([]);

		const cacheKey = `podcast:search:${q}:${max}`;
		const cached = apiCache.get<Podcast[]>(cacheKey);
		if (cached) return json(cached);

		const params = new URLSearchParams({ q, max });
		const res = await fetch(`${PI_BASE}/search/byterm?${params}`, { headers: piHeaders() });
		if (!res.ok) return json([], { status: res.status });

		const data = await res.json();
		const result = (data.feeds ?? []).map(transformFeed);
		apiCache.set(cacheKey, result, 15 * 60 * 1000);
		return json(result);
	}
};

const trending: PluginRoute = {
	method: 'GET',
	pattern: '/api/podcasts/trending',
	handler: async ({ url }) => {
		const max = url.searchParams.get('max') ?? '15';
		const cat = url.searchParams.get('cat');
		const cacheKey = `podcast:trending:${max}:${cat ?? ''}`;

		const cached = apiCache.get<Podcast[]>(cacheKey);
		if (cached) return json(cached);

		const params = new URLSearchParams({ max, lang: 'en' });
		if (cat) params.set('cat', cat);

		const res = await fetch(`${PI_BASE}/podcasts/trending?${params}`, { headers: piHeaders() });
		if (!res.ok) return json([], { status: res.status });

		const data = await res.json();
		const result = (data.feeds ?? []).map(transformFeed);
		apiCache.set(cacheKey, result, 60 * 60 * 1000);
		return json(result);
	}
};

const categories: PluginRoute = {
	method: 'GET',
	pattern: '/api/podcasts/categories',
	handler: async () => {
		const CACHE_KEY = 'podcast:categories';
		const TTL = 24 * 60 * 60 * 1000;

		const cached = apiCache.get<PodcastCategory[]>(CACHE_KEY);
		if (cached) return json(cached, { headers: { 'Cache-Control': 'max-age=86400' } });

		const res = await fetch(`${PI_BASE}/categories/list`, { headers: piHeaders() });
		if (!res.ok) return json([], { status: res.status });

		const data = await res.json();
		const cats: PodcastCategory[] = (data.feeds ?? []).map(
			(f: { id: number; name: string }) => ({
				id: f.id,
				name: f.name
			})
		);

		apiCache.set(CACHE_KEY, cats, TTL);
		return json(cats, { headers: { 'Cache-Control': 'max-age=86400' } });
	}
};

const feed: PluginRoute = {
	method: 'GET',
	pattern: '/api/podcasts/feed',
	handler: async ({ url }) => {
		const feedUrl = url.searchParams.get('url');
		if (!feedUrl) return json({ error: 'Missing url param' }, { status: 400 });

		const cacheKey = `podcast:feed:${feedUrl}`;
		const cached = apiCache.get(cacheKey);
		if (cached) return json(cached);

		try {
			const res = await fetch(feedUrl, {
				headers: { 'User-Agent': 'Hibiki/1.0' },
				signal: AbortSignal.timeout(15000)
			});
			if (!res.ok) return json({ error: 'Feed fetch failed' }, { status: res.status });

			const xml = await res.text();
			const detail = parseFeed(feedUrl, xml);

			apiCache.set(cacheKey, detail, 30 * 60 * 1000);
			return json(detail);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Unknown error';
			return json({ error: msg }, { status: 500 });
		}
	}
};

export const routes: PluginRoute[] = [search, trending, categories, feed];
