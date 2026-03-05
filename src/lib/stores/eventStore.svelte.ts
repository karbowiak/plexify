import { openDB, type IDBPDatabase } from 'idb';
import { source } from 'sveltekit-sse';
import { getBackendConfig, hasBackendConfig } from './configStore.svelte';
import { handleIcyUpdate } from './radioStore.svelte';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventCategory = 'play' | 'system' | 'discovery';

export type AppEventType =
	// Play events
	| 'track_play'
	| 'radio_play'
	| 'podcast_play'
	// System events
	| 'analysis_start'
	| 'analysis_complete'
	| 'analysis_error'
	| 'sync_start'
	| 'sync_complete'
	| 'sync_error'
	| 'download_start'
	| 'download_complete'
	| 'download_error'
	| 'system_info'
	| 'system_warn'
	| 'system_error'
	| 'radio_icy_update'
	// Discovery events
	| 'new_album'
	| 'playlist_updated'
	| 'recommendation';

export interface AppEvent {
	id?: number;
	category: EventCategory;
	type: AppEventType;
	timestamp: Date;
	payload: Record<string, unknown>;
}

export interface BackendBreakdown {
	backendId: string;
	count: number;
	enabled: boolean;
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

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

const DB_NAME = 'app-events';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const MAX_ITEMS = 500;
const PLAY_RETENTION_MS = 365 * 24 * 60 * 60 * 1000; // 365 days
const SYSTEM_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

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
				store.createIndex('by-timestamp', 'timestamp');
				store.createIndex('by-category', 'category');
				store.createIndex('by-type', 'type');
			}
		});
	}
	return dbPromise;
}

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

let items = $state<AppEvent[]>([]);
let activeOperations = $state<Map<string, Record<string, unknown>>>(new Map());
let unreadDiscoveryCount = $state(0);

// Filters for the activity page
let categoryFilter = $state<EventCategory | null>(null);
let backendFilter = $state<string | null>(null);
let showHidden = $state(false);
let totalCount = $state(0);
let loading = $state(false);

// SSE connection cleanup
let sseCleanup: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getItems(): AppEvent[] {
	return items;
}

export function getRecentEvents(limit = 20): AppEvent[] {
	return items.slice(0, limit);
}

export function getActiveOperations(): Map<string, Record<string, unknown>> {
	return activeOperations;
}

export function getActiveCount(): number {
	return activeOperations.size;
}

export function getTotalCount(): number {
	return totalCount;
}

export function isLoading(): boolean {
	return loading;
}

export function getBackendFilter(): string | null {
	return backendFilter;
}

export function getShowHidden(): boolean {
	return showHidden;
}

export function getUnreadDiscoveryCount(): number {
	return unreadDiscoveryCount;
}

export function clearUnreadDiscoveries(): void {
	unreadDiscoveryCount = 0;
}

export function getRecentArtists(limit = 20): RecentArtist[] {
	const seen = new Set<string>();
	const results: RecentArtist[] = [];

	for (const event of items) {
		if (event.type !== 'track_play') continue;
		const p = event.payload;
		const artistId = p.artistId as string | null;
		if (!artistId || seen.has(artistId)) continue;
		if (!shouldShowEvent(event)) continue;

		seen.add(artistId);
		results.push({
			artistId,
			artistName: (p.artistName as string) ?? '',
			imageUrl: (p.imageUrl as string | null) ?? null,
			backendId: (p.backendId as string) ?? ''
		});

		if (results.length >= limit) break;
	}

	return results;
}

export function getRecentAlbums(limit = 20): RecentAlbum[] {
	const seen = new Set<string>();
	const results: RecentAlbum[] = [];

	for (const event of items) {
		if (event.type !== 'track_play') continue;
		const p = event.payload;
		const albumId = p.albumId as string | null;
		if (!albumId || seen.has(albumId)) continue;
		if (!shouldShowEvent(event)) continue;

		seen.add(albumId);
		results.push({
			albumId,
			albumName: (p.albumName as string) ?? '',
			artistName: (p.artistName as string) ?? '',
			imageUrl: (p.imageUrl as string | null) ?? null,
			backendId: (p.backendId as string) ?? ''
		});

		if (results.length >= limit) break;
	}

	return results;
}

// ---------------------------------------------------------------------------
// Backend visibility
// ---------------------------------------------------------------------------

function isBackendEnabled(id: string): boolean {
	if (!hasBackendConfig(id)) return true;
	return getBackendConfig(id).enabled;
}

function shouldShowEvent(event: AppEvent): boolean {
	if (categoryFilter && event.category !== categoryFilter) return false;
	if (event.category === 'play') {
		const bid = event.payload.backendId as string | undefined;
		if (bid) {
			if (backendFilter && bid !== backendFilter) return false;
			if (!showHidden && !isBackendEnabled(bid)) return false;
		}
	}
	return true;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function setCategoryFilter(cat: EventCategory | null) {
	categoryFilter = cat;
}

export function setBackendFilter(id: string | null) {
	backendFilter = id;
}

export function toggleShowHidden() {
	showHidden = !showHidden;
}

// ---------------------------------------------------------------------------
// Log an event
// ---------------------------------------------------------------------------

export async function logAppEvent(event: Omit<AppEvent, 'id'>): Promise<void> {
	if (typeof window === 'undefined') return;

	// Handle active operations tracking
	const opId = event.payload.operationId as string | undefined;
	if (opId && event.category === 'system') {
		const isFinal = event.payload.isFinal as boolean | undefined;
		if (isFinal) {
			const next = new Map(activeOperations);
			next.delete(opId);
			activeOperations = next;
		} else {
			const next = new Map(activeOperations);
			next.set(opId, event.payload);
			activeOperations = next;
		}
	}

	// Deduplicate discovery events across reloads
	if (event.category === 'discovery') {
		const entityId = event.payload.entityId as string | undefined;
		if (entityId && items.some(e => e.type === event.type && e.payload.entityId === entityId)) {
			return;
		}
	}

	// Track unread discoveries
	if (event.category === 'discovery') {
		unreadDiscoveryCount++;
	}

	// Prepend to in-memory state, cap at MAX_ITEMS
	const full: AppEvent = { ...event };
	items = [full, ...items].slice(0, MAX_ITEMS);
	totalCount++;

	// Write to IDB (fire-and-forget)
	getDB()
		.then((db) => db.add(STORE_NAME, event))
		.catch(() => {});

	// POST to SSE bus for cross-tab distribution (fire-and-forget)
	fetch('/api/events', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(event)
	}).catch(() => {});
}

// ---------------------------------------------------------------------------
// Load events (paginated IDB read)
// ---------------------------------------------------------------------------

export async function loadEvents(
	limit = 100,
	offset = 0,
	filters?: { category?: EventCategory; backendId?: string }
): Promise<AppEvent[]> {
	if (typeof window === 'undefined') return [];
	loading = true;

	try {
		const db = await getDB();
		const tx = db.transaction(STORE_NAME, 'readonly');
		const index = tx.store.index('by-timestamp');

		const results: AppEvent[] = [];
		let skipped = 0;
		let total = 0;

		let cursor = await index.openCursor(null, 'prev');
		while (cursor) {
			const event = cursor.value as AppEvent;
			total++;

			let matches = true;
			if (filters?.category && event.category !== filters.category) matches = false;
			if (filters?.backendId && event.payload.backendId !== filters.backendId) matches = false;
			if (event.category === 'play') {
				const bid = event.payload.backendId as string | undefined;
				if (bid && !showHidden && !isBackendEnabled(bid)) matches = false;
			}

			if (matches) {
				if (skipped < offset) {
					skipped++;
				} else if (results.length < limit) {
					results.push(event);
				}
			}

			cursor = await cursor.continue();
		}

		totalCount = total;

		if (offset === 0) {
			items = results;
		} else {
			items = [...items, ...results];
		}

		return results;
	} finally {
		loading = false;
	}
}

// ---------------------------------------------------------------------------
// Backend breakdown for filter chips
// ---------------------------------------------------------------------------

export async function getBackendBreakdown(): Promise<BackendBreakdown[]> {
	if (typeof window === 'undefined') return [];

	const db = await getDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const index = tx.store.index('by-timestamp');

	const counts = new Map<string, number>();

	let cursor = await index.openCursor(null, 'prev');
	while (cursor) {
		const event = cursor.value as AppEvent;
		if (event.category === 'play') {
			const bid = event.payload.backendId as string;
			if (bid) {
				counts.set(bid, (counts.get(bid) ?? 0) + 1);
			}
		}
		cursor = await cursor.continue();
	}

	return [...counts.entries()].map(([backendId, count]) => ({
		backendId,
		count,
		enabled: isBackendEnabled(backendId)
	}));
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export async function clearEvents(): Promise<void> {
	if (typeof window === 'undefined') return;
	const db = await getDB();
	await db.clear(STORE_NAME);
	items = [];
	totalCount = 0;
	activeOperations = new Map();
}

// ---------------------------------------------------------------------------
// Init — prune old entries, hydrate state, connect SSE
// ---------------------------------------------------------------------------

export async function initEventStore(): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const db = await getDB();

		// Prune old entries (30d plays, 48h system)
		const playCutoff = new Date(Date.now() - PLAY_RETENTION_MS);
		const systemCutoff = new Date(Date.now() - SYSTEM_RETENTION_MS);

		const tx = db.transaction(STORE_NAME, 'readwrite');
		const index = tx.store.index('by-timestamp');
		let cursor = await index.openCursor(null, 'next');
		while (cursor) {
			const event = cursor.value as AppEvent;
			const ts = new Date(event.timestamp);
			if (
				(event.category === 'play' && ts < playCutoff) ||
				(event.category !== 'play' && ts < systemCutoff)
			) {
				await cursor.delete();
			} else {
				break; // sorted ascending, all later entries are newer
			}
			cursor = await cursor.continue();
		}
		await tx.done;

		// Hydrate: load most recent entries (descending)
		const tx2 = db.transaction(STORE_NAME, 'readonly');
		const index2 = tx2.store.index('by-timestamp');
		const results: AppEvent[] = [];
		let total = 0;
		let cursor2 = await index2.openCursor(null, 'prev');
		while (cursor2) {
			total++;
			if (results.length < MAX_ITEMS) {
				results.push(cursor2.value as AppEvent);
			}
			cursor2 = await cursor2.continue();
		}

		// Deduplicate discovery events (cleans up dupes from prior sessions)
		const seen = new Set<string>();
		const deduped: AppEvent[] = [];
		const idsToDelete: number[] = [];
		for (const e of results) {
			if (e.category === 'discovery' && e.payload.entityId) {
				const key = `${e.type}::${e.payload.entityId}`;
				if (seen.has(key)) {
					if (e.id != null) idsToDelete.push(e.id);
					continue;
				}
				seen.add(key);
			}
			deduped.push(e);
		}

		items = deduped;
		totalCount = total - idsToDelete.length;

		// Purge duplicates from IDB (fire-and-forget)
		if (idsToDelete.length > 0) {
			getDB()
				.then(async (database) => {
					const dtx = database.transaction(STORE_NAME, 'readwrite');
					for (const id of idsToDelete) dtx.store.delete(id);
					await dtx.done;
				})
				.catch(() => {});
		}
	} catch {
		// IDB unavailable — start with empty state
	}

	// Connect SSE for cross-tab events
	connectSSE();
}

export function destroyEventStore(): void {
	sseCleanup?.();
	sseCleanup = null;
}

// ---------------------------------------------------------------------------
// SSE connection
// ---------------------------------------------------------------------------

function connectSSE() {
	if (typeof window === 'undefined') return;

	try {
		const conn = source('/api/events');
		const eventStore = conn.select('event').json<AppEvent>((err) => {
			console.warn('Event SSE parse error:', err);
			return null as unknown as AppEvent;
		});

		let lastSeen: string | null = null;
		const unsubscribe = eventStore.subscribe((event) => {
			if (!event) return;

			// Route ICY updates to radioStore — don't add to activity timeline
			if (event.type === 'radio_icy_update') {
				handleIcyUpdate(event.payload as { artist: string | null; title: string | null; streamTitle: string });
				return;
			}

			// Deduplicate: don't re-add events we just posted
			const key = `${event.type}-${new Date(event.timestamp).getTime()}`;
			if (key === lastSeen) return;
			lastSeen = key;

			// Add to in-memory state (don't re-persist to IDB — it came from another tab)
			items = [event, ...items].slice(0, MAX_ITEMS);
		});

		sseCleanup = () => {
			unsubscribe();
			conn.close();
		};
	} catch {
		// SSE connection failure is non-fatal
	}
}
