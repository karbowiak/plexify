import { openDB, type IDBPDatabase } from 'idb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityLevel = 'info' | 'success' | 'warn' | 'error';

export interface ActivityEvent {
	id?: number;
	level: ActivityLevel;
	message: string;
	detail?: string;
	timestamp: Date;
}

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

const DB_NAME = 'app-activity';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const MAX_ITEMS = 200;
const RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

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
			}
		});
	}
	return dbPromise;
}

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

let items = $state<ActivityEvent[]>([]);
let activeCount = $state(0);

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getActivityItems(): ActivityEvent[] {
	return items;
}

export function getActiveCount(): number {
	return activeCount;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function logActivity(level: ActivityLevel, message: string, detail?: string): void {
	const event: ActivityEvent = {
		level,
		message,
		detail,
		timestamp: new Date()
	};

	// Prepend to in-memory state, cap at MAX_ITEMS
	items = [event, ...items].slice(0, MAX_ITEMS);

	// Write to IDB (fire-and-forget)
	getDB()
		.then((db) => db.add(STORE_NAME, event))
		.catch(() => {});
}

export function markAnalysisStart(): void {
	activeCount++;
}

export function markAnalysisEnd(): void {
	activeCount = Math.max(0, activeCount - 1);
}

export async function clearActivityLog(): Promise<void> {
	items = [];
	try {
		const db = await getDB();
		await db.clear(STORE_NAME);
	} catch {
		// ignore
	}
}

// ---------------------------------------------------------------------------
// Init — prune old entries, hydrate state
// ---------------------------------------------------------------------------

export async function initActivityStore(): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const db = await getDB();
		const cutoff = new Date(Date.now() - RETENTION_MS);

		// Prune old entries
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const index = tx.store.index('by-timestamp');
		let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
		while (cursor) {
			await cursor.delete();
			cursor = await cursor.continue();
		}
		await tx.done;

		// Hydrate: load most recent entries (descending)
		const tx2 = db.transaction(STORE_NAME, 'readonly');
		const index2 = tx2.store.index('by-timestamp');
		const results: ActivityEvent[] = [];
		let cursor2 = await index2.openCursor(null, 'prev');
		while (cursor2 && results.length < MAX_ITEMS) {
			results.push(cursor2.value as ActivityEvent);
			cursor2 = await cursor2.continue();
		}

		items = results;
	} catch {
		// IDB unavailable — start with empty state
	}
}
