import { openDB, type IDBPDatabase } from 'idb';
import type { QueueItem } from './unifiedQueue.svelte';
import { getBackendConfig, hasBackendConfig } from './configStore.svelte';
import { getNowPlaying } from './radioStore.svelte';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryEntry {
	id?: number;
	type: 'track' | 'radio' | 'podcast';
	backendId: string;
	playedAt: Date;
	durationPlayedMs: number;
	title: string;
	subtitle: string;
	imageUrl: string | null;
	entityId: string;
	artistId: string | null;
	artistName: string | null;
	albumId: string | null;
	albumName: string | null;
	feedUrl: string | null;
	streamUrl: string | null;
	audioUrl: string | null;
}

export interface RecentArtist {
	artistId: string;
	artistName: string;
	imageUrl: string | null;
	backendId: string;
}

export interface RecentAlbum {
	albumId: string;
	albumName: string;
	artistName: string;
	imageUrl: string | null;
	backendId: string;
}

export interface BackendBreakdown {
	backendId: string;
	count: number;
	enabled: boolean;
}

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

const DB_NAME = 'listening-history';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
	if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: 'id',
					autoIncrement: true
				});
				store.createIndex('by-playedAt', 'playedAt');
				store.createIndex('by-backendId', 'backendId');
				store.createIndex('by-type', 'type');
			}
		});
	}
	return dbPromise;
}

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

let recentHistory = $state<HistoryEntry[]>([]);
let recentArtists = $state<RecentArtist[]>([]);
let recentAlbums = $state<RecentAlbum[]>([]);
let totalCount = $state(0);
let hiddenCount = $state(0);
let loading = $state(false);
let showHidden = $state(false);
let backendFilter = $state<string | null>(null);

// Getters
export function getRecentHistory(): HistoryEntry[] {
	return recentHistory;
}
export function getRecentArtists(): RecentArtist[] {
	return recentArtists;
}
export function getRecentAlbums(): RecentAlbum[] {
	return recentAlbums;
}
export function getTotalCount(): number {
	return totalCount;
}
export function getHiddenCount(): number {
	return hiddenCount;
}
export function isLoading(): boolean {
	return loading;
}
export function getShowHidden(): boolean {
	return showHidden;
}
export function getBackendFilter(): string | null {
	return backendFilter;
}

// ---------------------------------------------------------------------------
// Backend visibility check
// ---------------------------------------------------------------------------

function isBackendEnabled(id: string): boolean {
	if (!hasBackendConfig(id)) return true; // unconfigured backends are visible by default
	return getBackendConfig(id).enabled;
}

function shouldShow(entry: HistoryEntry): boolean {
	if (backendFilter && entry.backendId !== backendFilter) return false;
	if (!showHidden && !isBackendEnabled(entry.backendId)) return false;
	return true;
}

// ---------------------------------------------------------------------------
// Record a play
// ---------------------------------------------------------------------------

export async function recordPlay(
	item: QueueItem,
	backendId: string,
	durationPlayedMs: number
): Promise<void> {
	if (typeof window === 'undefined') return;

	const entry: Omit<HistoryEntry, 'id'> = extractDisplayData(item, backendId, durationPlayedMs);

	const db = await getDB();
	const id = await db.add(STORE_NAME, entry);

	// Live-update reactive state if history has been loaded
	if (recentHistory.length > 0 || totalCount > 0) {
		const full: HistoryEntry = { ...entry, id: id as number };
		if (shouldShow(full)) {
			recentHistory = [full, ...recentHistory];
		}
		totalCount++;
	}
}

function extractDisplayData(
	item: QueueItem,
	backendId: string,
	durationPlayedMs: number
): Omit<HistoryEntry, 'id'> {
	const base = {
		backendId,
		playedAt: new Date(),
		durationPlayedMs
	};

	switch (item.type) {
		case 'track':
			return {
				...base,
				type: 'track',
				title: item.data.title,
				subtitle: item.data.artistName,
				imageUrl: item.data.thumb,
				entityId: item.data.id,
				artistId: item.data.artistId,
				artistName: item.data.artistName,
				albumId: item.data.albumId,
				albumName: item.data.albumName,
				feedUrl: null,
				streamUrl: null,
				audioUrl: null
			};
		case 'radio': {
			const icy = getNowPlaying();
			const subtitle =
				icy?.artist && icy?.title
					? `${icy.artist} – ${icy.title}`
					: item.data.tags.slice(0, 3).join(' · ');
			return {
				...base,
				type: 'radio',
				title: item.data.name,
				subtitle,
				imageUrl: item.data.favicon || null,
				entityId: item.data.uuid,
				artistId: null,
				artistName: null,
				albumId: null,
				albumName: null,
				feedUrl: null,
				streamUrl: item.data.stream_url,
				audioUrl: null
			};
		}
		case 'podcast':
			return {
				...base,
				type: 'podcast',
				title: item.data.title,
				subtitle: item.podcastTitle,
				imageUrl: item.data.artwork_url || item.podcastArtwork || null,
				entityId: item.data.guid,
				artistId: null,
				artistName: null,
				albumId: null,
				albumName: null,
				feedUrl: item.feedUrl,
				streamUrl: null,
				audioUrl: item.data.audio_url
			};
	}
}

// ---------------------------------------------------------------------------
// Load history (paginated, descending by playedAt)
// ---------------------------------------------------------------------------

export async function loadHistory(limit = 100, offset = 0): Promise<void> {
	if (typeof window === 'undefined') return;
	loading = true;

	try {
		const db = await getDB();
		const tx = db.transaction(STORE_NAME, 'readonly');
		const index = tx.store.index('by-playedAt');

		const results: HistoryEntry[] = [];
		let skipped = 0;
		let total = 0;
		let hidden = 0;

		let cursor = await index.openCursor(null, 'prev');
		while (cursor) {
			const entry = cursor.value as HistoryEntry;
			total++;

			if (!isBackendEnabled(entry.backendId)) {
				hidden++;
			}

			if (shouldShow(entry)) {
				if (skipped < offset) {
					skipped++;
				} else if (results.length < limit) {
					results.push(entry);
				}
			}

			cursor = await cursor.continue();
		}

		if (offset === 0) {
			recentHistory = results;
		} else {
			recentHistory = [...recentHistory, ...results];
		}
		totalCount = total;
		hiddenCount = hidden;
	} finally {
		loading = false;
	}
}

// ---------------------------------------------------------------------------
// Load recent artists (deduplicated, most-recent-first)
// ---------------------------------------------------------------------------

export async function loadRecentArtists(limit = 20): Promise<void> {
	if (typeof window === 'undefined') return;

	const db = await getDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const index = tx.store.index('by-playedAt');

	const seen = new Set<string>();
	const results: RecentArtist[] = [];

	let cursor = await index.openCursor(null, 'prev');
	while (cursor && results.length < limit) {
		const entry = cursor.value as HistoryEntry;

		if (entry.artistId && !seen.has(entry.artistId) && shouldShow(entry)) {
			seen.add(entry.artistId);
			results.push({
				artistId: entry.artistId,
				artistName: entry.artistName!,
				imageUrl: entry.imageUrl,
				backendId: entry.backendId
			});
		}

		cursor = await cursor.continue();
	}

	recentArtists = results;
}

// ---------------------------------------------------------------------------
// Load recent albums (deduplicated, most-recent-first)
// ---------------------------------------------------------------------------

export async function loadRecentAlbums(limit = 20): Promise<void> {
	if (typeof window === 'undefined') return;

	const db = await getDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const index = tx.store.index('by-playedAt');

	const seen = new Set<string>();
	const results: RecentAlbum[] = [];

	let cursor = await index.openCursor(null, 'prev');
	while (cursor && results.length < limit) {
		const entry = cursor.value as HistoryEntry;

		if (entry.albumId && !seen.has(entry.albumId) && shouldShow(entry)) {
			seen.add(entry.albumId);
			results.push({
				albumId: entry.albumId,
				albumName: entry.albumName!,
				artistName: entry.artistName ?? '',
				imageUrl: entry.imageUrl,
				backendId: entry.backendId
			});
		}

		cursor = await cursor.continue();
	}

	recentAlbums = results;
}

// ---------------------------------------------------------------------------
// Backend breakdown for filter chips
// ---------------------------------------------------------------------------

export async function getBackendBreakdown(): Promise<BackendBreakdown[]> {
	if (typeof window === 'undefined') return [];

	const db = await getDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const index = tx.store.index('by-backendId');

	const counts = new Map<string, number>();

	let cursor = await index.openCursor();
	while (cursor) {
		const entry = cursor.value as HistoryEntry;
		counts.set(entry.backendId, (counts.get(entry.backendId) ?? 0) + 1);
		cursor = await cursor.continue();
	}

	return [...counts.entries()].map(([backendId, count]) => ({
		backendId,
		count,
		enabled: isBackendEnabled(backendId)
	}));
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function toggleShowHidden() {
	showHidden = !showHidden;
}

export function setBackendFilter(id: string | null) {
	backendFilter = id;
}

export async function clearHistory(): Promise<void> {
	if (typeof window === 'undefined') return;

	const db = await getDB();
	await db.clear(STORE_NAME);
	recentHistory = [];
	recentArtists = [];
	recentAlbums = [];
	totalCount = 0;
	hiddenCount = 0;
}
