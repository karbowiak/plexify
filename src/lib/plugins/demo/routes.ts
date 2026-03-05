import { json } from '@sveltejs/kit';
import type { PluginRoute } from '../router';

const DEEZER_BASE = 'https://api.deezer.com';

const deezerProxy: PluginRoute = {
	method: 'GET',
	pattern: '/api/deezer/*',
	handler: async ({ url }) => {
		const path = url.pathname.replace('/api/deezer/', '');
		const query = url.search;
		const target = `${DEEZER_BASE}/${path}${query}`;

		const res = await fetch(target);
		if (!res.ok) {
			return json({ error: `Deezer API error: ${res.status}` }, { status: res.status });
		}

		const data = await res.json();
		return json(data);
	}
};

export const routes: PluginRoute[] = [deezerProxy];
