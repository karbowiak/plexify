import { browser } from '$app/environment';
import type { RadioStation, RadioCountry, RadioTag } from '$lib/backends/models/radioStation';
import {
	type RawStation,
	type RawCountry,
	type RawTag,
	transformStation,
	transformCountry,
	transformTag
} from './serverTypes';

const BASE = browser ? '/api/radio' : 'https://de1.api.radio-browser.info/json';

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export interface SearchParams {
	name?: string;
	tag?: string;
	country?: string;
	limit?: number;
	offset?: number;
	order?: string;
}

export async function searchStations(params: SearchParams): Promise<RadioStation[]> {
	if (browser) {
		const q = new URLSearchParams();
		if (params.name) q.set('name', params.name);
		if (params.tag) q.set('tag', params.tag);
		if (params.country) q.set('country', params.country);
		if (params.limit) q.set('limit', String(params.limit));
		if (params.offset) q.set('offset', String(params.offset));
		if (params.order) q.set('order', params.order);
		const res = await fetch(`${BASE}/search?${q}`);
		if (!res.ok) throw new Error(`Search failed: ${res.status}`);
		return res.json();
	}
	const q = new URLSearchParams({
		name: params.name ?? '',
		tag: params.tag ?? '',
		country: params.country ?? '',
		limit: String(params.limit ?? 30),
		offset: String(params.offset ?? 0),
		order: params.order ?? 'votes',
		reverse: 'true',
		hidebroken: 'true'
	});
	const res = await fetch(`${BASE}/stations/search?${q}`);
	if (!res.ok) throw new Error(`Search failed: ${res.status}`);
	const raw: RawStation[] = await res.json();
	return raw.map(transformStation);
}

export async function topStations(
	category: string = 'topvote',
	count: number = 15
): Promise<RadioStation[]> {
	if (browser) {
		const res = await fetch(`${BASE}/top?category=${category}&count=${count}`);
		if (!res.ok) throw new Error(`Top stations failed: ${res.status}`);
		return res.json();
	}
	const res = await fetch(`${BASE}/stations/${category}/${count}?hidebroken=true`);
	if (!res.ok) throw new Error(`Top stations failed: ${res.status}`);
	const raw: RawStation[] = await res.json();
	return raw.map(transformStation);
}

export async function getCountries(): Promise<RadioCountry[]> {
	if (browser) {
		const res = await fetch(`${BASE}/countries`);
		if (!res.ok) throw new Error(`Countries failed: ${res.status}`);
		return res.json();
	}
	const res = await fetch(`${BASE}/countries?order=stationcount&reverse=true`);
	if (!res.ok) throw new Error(`Countries failed: ${res.status}`);
	const raw: RawCountry[] = await res.json();
	return raw
		.filter((c) => c.name && c.stationcount > 0)
		.map(transformCountry);
}

export async function getTags(limit: number = 100): Promise<RadioTag[]> {
	if (browser) {
		const res = await fetch(`${BASE}/tags?limit=${limit}`);
		if (!res.ok) throw new Error(`Tags failed: ${res.status}`);
		return res.json();
	}
	const res = await fetch(`${BASE}/tags?order=stationcount&reverse=true&limit=${limit}`);
	if (!res.ok) throw new Error(`Tags failed: ${res.status}`);
	const raw: RawTag[] = await res.json();
	return raw
		.filter((t) => t.name && t.stationcount > 0)
		.map(transformTag);
}

export async function registerClick(uuid: string): Promise<void> {
	if (browser) {
		fetch('/api/radio/click', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uuid })
		}).catch(() => {});
	} else {
		fetch(`https://de1.api.radio-browser.info/json/url/${uuid}`).catch(() => {});
	}
}
