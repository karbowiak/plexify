import type { RadioStation } from '$lib/radio/types';
import { emitRadioPlay } from '$lib/events/emit';

const STORAGE_KEY = 'radio-state';
const MAX_RECENT = 50;

interface RadioPersistedState {
	favorites: RadioStation[];
	recentStations: RadioStation[];
}

function load(): RadioPersistedState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				favorites: parsed.favorites ?? [],
				recentStations: parsed.recentStations ?? []
			};
		}
	} catch {
		// ignore corrupt data
	}
	return { favorites: [], recentStations: [] };
}

const initial = load();

let favorites = $state<RadioStation[]>(initial.favorites);
let recentStations = $state<RadioStation[]>(initial.recentStations);
let nowPlaying = $state<{ artist: string | null; title: string | null } | null>(null);

// ICY tracking state
let currentStation: RadioStation | null = null;
let currentStreamUrl: string | null = null;
let lastIcyKey: string | null = null;

function save() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites, recentStations }));
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getFavorites(): RadioStation[] {
	return favorites;
}

export function getRecentStations(): RadioStation[] {
	return recentStations;
}

export function getNowPlaying(): { artist: string | null; title: string | null } | null {
	return nowPlaying;
}

// ---------------------------------------------------------------------------
// Favorites & recents
// ---------------------------------------------------------------------------

export function addToRecent(station: RadioStation) {
	recentStations = [station, ...recentStations.filter((s) => s.uuid !== station.uuid)].slice(
		0,
		MAX_RECENT
	);
	save();
}

export function toggleFavorite(station: RadioStation) {
	const idx = favorites.findIndex((s) => s.uuid === station.uuid);
	if (idx >= 0) {
		favorites = favorites.filter((s) => s.uuid !== station.uuid);
	} else {
		favorites = [station, ...favorites];
	}
	save();
}

export function isFavorite(uuid: string): boolean {
	return favorites.some((s) => s.uuid === uuid);
}

export function clearRecent() {
	recentStations = [];
	save();
}

// ---------------------------------------------------------------------------
// ICY metadata — driven by unified SSE via eventStore
// ---------------------------------------------------------------------------

export function handleIcyUpdate(data: { artist: string | null; title: string | null; streamTitle: string }) {
	nowPlaying = { artist: data.artist, title: data.title };

	// Emit radio_play on each distinct ICY track change
	const key = `${data.artist ?? ''}|${data.title ?? ''}`;
	if (key !== lastIcyKey && (data.artist || data.title)) {
		lastIcyKey = key;
		const subtitle = [data.artist, data.title].filter(Boolean).join(' — ');
		emitRadioPlay({
			title: currentStation?.name ?? 'Radio',
			subtitle,
			imageUrl: currentStation?.favicon ?? null,
			entityId: currentStation?.uuid ?? '',
			backendId: 'radio-browser',
			streamUrl: currentStreamUrl ?? ''
		});
	}
}

export function startIcyStream(streamUrl: string, station?: RadioStation) {
	stopIcyStream();
	currentStreamUrl = streamUrl;
	currentStation = station ?? null;
	lastIcyKey = null;
}

export function stopIcyStream() {
	nowPlaying = null;
	currentStation = null;
	currentStreamUrl = null;
	lastIcyKey = null;
}
