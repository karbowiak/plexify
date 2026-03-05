import { json } from '@sveltejs/kit';
import type { PluginRoute } from '../router';
import { createIcyParser } from './icyParser';
import { setMetadata, subscribe, getMetadata } from './icyMetadataStore';
import {
	type RawStation,
	type RawCountry,
	type RawTag,
	transformStation,
	transformCountry,
	transformTag
} from './serverTypes';
import type { RadioStation, RadioCountry, RadioTag } from '$lib/backends/models/radioStation';
import { apiCache } from '$lib/server/apiCache';
import { produce } from 'sveltekit-sse';

const API_BASE = 'https://de1.api.radio-browser.info';

const stream: PluginRoute = {
	method: 'GET',
	pattern: '/api/radio/stream',
	handler: async ({ url }) => {
		const streamUrl = url.searchParams.get('url');
		if (!streamUrl) return new Response('Missing url param', { status: 400 });

		let parsed: URL;
		try {
			parsed = new URL(streamUrl);
		} catch {
			return new Response('Invalid URL', { status: 400 });
		}

		if (!['http:', 'https:'].includes(parsed.protocol)) {
			return new Response('Invalid protocol', { status: 400 });
		}

		const upstream = await fetch(streamUrl, {
			headers: { 'Icy-MetaData': '1' }
		});
		if (!upstream.ok || !upstream.body) {
			return new Response('Upstream error', { status: 502 });
		}

		const metaIntHeader = upstream.headers.get('icy-metaint');
		const contentType = upstream.headers.get('Content-Type') || 'audio/mpeg';

		if (metaIntHeader) {
			const metaInt = parseInt(metaIntHeader, 10);
			if (metaInt > 0) {
				const parser = createIcyParser(metaInt, (meta) => {
					setMetadata(streamUrl, meta.streamTitle);
				});
				const cleanStream = upstream.body.pipeThrough(parser);
				return new Response(cleanStream, {
					headers: { 'Content-Type': contentType }
				});
			}
		}

		return new Response(upstream.body, {
			headers: { 'Content-Type': contentType }
		});
	}
};

const search: PluginRoute = {
	method: 'GET',
	pattern: '/api/radio/search',
	handler: async ({ url }) => {
		const name = url.searchParams.get('name') ?? '';
		const tag = url.searchParams.get('tag') ?? '';
		const country = url.searchParams.get('country') ?? '';
		const limit = url.searchParams.get('limit') ?? '30';
		const offset = url.searchParams.get('offset') ?? '0';
		const order = url.searchParams.get('order') ?? 'votes';
		const cacheKey = `radio:search:${name}:${tag}:${country}:${limit}:${offset}:${order}`;

		const cached = apiCache.get<RadioStation[]>(cacheKey);
		if (cached) return json(cached);

		const params = new URLSearchParams({
			name, tag, country, limit, offset, order,
			reverse: 'true',
			hidebroken: 'true'
		});

		const res = await fetch(`${API_BASE}/json/stations/search?${params}`);
		if (!res.ok) return json([], { status: res.status });

		const raw: RawStation[] = await res.json();
		const result = raw.map(transformStation);
		apiCache.set(cacheKey, result, 15 * 60 * 1000);
		return json(result);
	}
};

const top: PluginRoute = {
	method: 'GET',
	pattern: '/api/radio/top',
	handler: async ({ url }) => {
		const category = url.searchParams.get('category') ?? 'topvote';
		const count = url.searchParams.get('count') ?? '15';
		const cacheKey = `radio:top:${category}:${count}`;

		const cached = apiCache.get<RadioStation[]>(cacheKey);
		if (cached) return json(cached);

		const res = await fetch(`${API_BASE}/json/stations/${category}/${count}?hidebroken=true`);
		if (!res.ok) return json([], { status: res.status });

		const raw: RawStation[] = await res.json();
		const result = raw.map(transformStation);
		apiCache.set(cacheKey, result, 60 * 60 * 1000);
		return json(result);
	}
};

const countries: PluginRoute = {
	method: 'GET',
	pattern: '/api/radio/countries',
	handler: async () => {
		const CACHE_KEY = 'radio:countries';
		const cached = apiCache.get<RadioCountry[]>(CACHE_KEY);
		if (cached) return json(cached);

		const res = await fetch(`${API_BASE}/json/countries?order=stationcount&reverse=true`);
		if (!res.ok) return json([], { status: res.status });

		const raw: RawCountry[] = await res.json();
		const result = raw
			.filter((c) => c.name && c.stationcount > 0)
			.map(transformCountry);

		apiCache.set(CACHE_KEY, result, 24 * 60 * 60 * 1000);
		return json(result);
	}
};

const tags: PluginRoute = {
	method: 'GET',
	pattern: '/api/radio/tags',
	handler: async ({ url }) => {
		const limit = url.searchParams.get('limit') ?? '100';
		const cacheKey = `radio:tags:${limit}`;

		const cached = apiCache.get<RadioTag[]>(cacheKey);
		if (cached) return json(cached);

		const res = await fetch(`${API_BASE}/json/tags?order=stationcount&reverse=true&limit=${limit}`);
		if (!res.ok) return json([], { status: res.status });

		const raw: RawTag[] = await res.json();
		const result = raw
			.filter((t) => t.name && t.stationcount > 0)
			.map(transformTag);

		apiCache.set(cacheKey, result, 24 * 60 * 60 * 1000);
		return json(result);
	}
};

const click: PluginRoute = {
	method: 'POST',
	pattern: '/api/radio/click',
	handler: async ({ request }) => {
		const { uuid } = await request.json();
		if (!uuid) return json({ ok: false }, { status: 400 });
		fetch(`${API_BASE}/json/url/${uuid}`).catch(() => {});
		return json({ ok: true });
	}
};

const nowplaying: PluginRoute = {
	method: 'POST',
	pattern: '/api/radio/nowplaying',
	handler: async ({ url }) => {
		const streamUrl = url.searchParams.get('url');
		if (!streamUrl) return new Response('Missing url parameter', { status: 400 });

		return produce(function start({ emit }) {
			const current = getMetadata(streamUrl);
			if (current) emit('metadata', JSON.stringify(current));

			const unsub = subscribe(streamUrl, (meta) => {
				const { error } = emit('metadata', JSON.stringify(meta));
				if (error) unsub();
			});

			return () => unsub();
		});
	}
};

export const routes: PluginRoute[] = [stream, search, top, countries, tags, click, nowplaying];
