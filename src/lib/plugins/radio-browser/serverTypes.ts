import type { RadioStation, RadioCountry, RadioTag } from '$lib/backends/models/radioStation';

export { type RadioStation, type RadioCountry, type RadioTag };

/** Convert ISO 3166-1 alpha-2 code to flag emoji */
export function countryFlag(code: string): string {
	if (!code || code.length !== 2) return '';
	return [...code.toUpperCase()]
		.map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
		.join('');
}

// ---------------------------------------------------------------------------
// Raw types from radio-browser.info API
// ---------------------------------------------------------------------------

export interface RawStation {
	stationuuid: string;
	name: string;
	url_resolved: string;
	homepage: string;
	favicon: string;
	tags: string;
	country: string;
	countrycode: string;
	language: string;
	codec: string;
	bitrate: number;
	hls: number;
	votes: number;
	clickcount: number;
	clicktrend: number;
}

export interface RawCountry {
	name: string;
	iso_3166_1: string;
	stationcount: number;
}

export interface RawTag {
	name: string;
	stationcount: number;
}

// ---------------------------------------------------------------------------
// Transformations
// ---------------------------------------------------------------------------

export function transformStation(raw: RawStation): RadioStation {
	return {
		uuid: raw.stationuuid,
		name: raw.name,
		stream_url: raw.url_resolved,
		homepage: raw.homepage,
		favicon: raw.favicon,
		tags: raw.tags
			? raw.tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [],
		country: raw.country,
		country_code: raw.countrycode,
		language: raw.language,
		codec: raw.codec,
		bitrate: raw.bitrate,
		is_hls: raw.hls === 1,
		votes: raw.votes,
		click_count: raw.clickcount,
		click_trend: raw.clicktrend
	};
}

export function transformCountry(raw: RawCountry): RadioCountry {
	return {
		name: raw.name,
		code: raw.iso_3166_1,
		station_count: raw.stationcount
	};
}

export function transformTag(raw: RawTag): RadioTag {
	return {
		name: raw.name,
		station_count: raw.stationcount
	};
}
