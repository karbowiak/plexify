import {
	skipNext,
	skipPrevious,
	seekTo,
	getState,
	getPosition,
	getDuration,
	resumePlayback,
	pausePlayback
} from './playerStore.svelte';
import { getCurrentItem, toDisplay } from './unifiedQueue.svelte';
import { getGeneral } from './configStore.svelte';
import { getNowPlaying } from './radioStore.svelte';

let cleanupFns: (() => void)[] = [];
let positionInterval: ReturnType<typeof setInterval> | null = null;
let lastMetadataId: string | null = null;
let lastNotifiedKey: string | null = null;

/**
 * Turn any artwork source into an absolute HTTP URL the browser/OS can fetch.
 * Firefox doesn't support blob: or data: URLs for Media Session artwork
 * (https://bugzilla.mozilla.org/show_bug.cgi?id=1686895), so we must use
 * real HTTP URLs pointing at our image proxy.
 */
function resolveArtworkUrl(src: string | null): string | null {
	if (!src) return null;
	// Custom protocol or remote URL → route through image proxy
	if (src.includes('://')) {
		return `${window.location.origin}/api/img?src=${encodeURIComponent(src)}`;
	}
	// Relative path → make absolute
	if (src.startsWith('/')) {
		return window.location.origin + src;
	}
	return src;
}

function getMetadataFields() {
	const item = getCurrentItem();
	if (!item) return null;

	const display = toDisplay(item);
	let artist = '';
	let album = '';

	if (item.type === 'track') {
		artist = item.data.artistName;
		album = item.data.albumName;
	} else if (item.type === 'radio') {
		const np = getNowPlaying();
		if (np?.title) {
			artist = np.artist ?? item.data.name;
			// Show "Song Title — Station Name" style
			album = item.data.name;
		} else {
			artist = item.data.name;
		}
	} else if (item.type === 'podcast') {
		artist = item.podcastTitle;
	}

	// For radio with now-playing, use the song title instead of station name
	let title = display.title;
	if (item.type === 'radio') {
		const np = getNowPlaying();
		if (np?.title) {
			title = np.title;
		}
	}

	return { id: display.id, title, artist, album, artwork: display.artwork };
}

function syncMetadata() {
	const fields = getMetadataFields();
	if (!fields) {
		navigator.mediaSession.metadata = null;
		lastMetadataId = null;
		return;
	}

	// Build a compound key so radio metadata changes trigger updates
	const np = getNowPlaying();
	const metaKey = `${fields.id}::${np?.title ?? ''}::${np?.artist ?? ''}`;
	if (metaKey === lastMetadataId) return;
	lastMetadataId = metaKey;

	// Set metadata immediately (title/artist, no artwork yet)
	navigator.mediaSession.metadata = new MediaMetadata({
		title: fields.title,
		artist: fields.artist,
		album: fields.album
	});

	// Pre-fetch artwork to warm the proxy cache, then update metadata with artwork.
	// Firefox's Media Session fetcher may fail on cold proxy URLs — warming ensures a cache hit.
	const artUrl = resolveArtworkUrl(fields.artwork);
	if (artUrl) {
		fetch(artUrl)
			.then(() => {
				if (lastMetadataId !== metaKey) return; // stale, skip update
				navigator.mediaSession.metadata = new MediaMetadata({
					title: fields.title,
					artist: fields.artist,
					album: fields.album,
					artwork: [{ src: artUrl, sizes: '512x512' }]
				});
			})
			.catch(() => {}); // artwork is best-effort
	}
}

function syncPlaybackState() {
	const state = getState();
	if (state === 'playing') {
		navigator.mediaSession.playbackState = 'playing';
	} else if (state === 'paused') {
		navigator.mediaSession.playbackState = 'paused';
	} else {
		navigator.mediaSession.playbackState = 'none';
	}
}

function syncPositionState() {
	const duration = getDuration();
	if (duration <= 0) return;

	try {
		navigator.mediaSession.setPositionState({
			duration: duration / 1000,
			playbackRate: 1,
			position: Math.min(getPosition() / 1000, duration / 1000)
		});
	} catch {
		// Position state can throw if values are out of range
	}
}

function registerActionHandlers() {
	const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
		['play', () => resumePlayback()],
		['pause', () => pausePlayback()],
		['nexttrack', () => skipNext()],
		['previoustrack', () => skipPrevious()],
		[
			'seekto',
			(details) => {
				if (details.seekTime != null) {
					seekTo(details.seekTime * 1000);
				}
			}
		],
		[
			'seekbackward',
			(details) => {
				const offset = (details.seekOffset ?? 10) * 1000;
				seekTo(Math.max(0, getPosition() - offset));
			}
		],
		[
			'seekforward',
			(details) => {
				const offset = (details.seekOffset ?? 10) * 1000;
				seekTo(Math.min(getDuration(), getPosition() + offset));
			}
		]
	];

	for (const [action, handler] of handlers) {
		try {
			navigator.mediaSession.setActionHandler(action, handler);
		} catch {
			// Some actions may not be supported
		}
	}

	return () => {
		for (const [action] of handlers) {
			try {
				navigator.mediaSession.setActionHandler(action, null);
			} catch {
				// Ignore cleanup errors
			}
		}
	};
}

async function showTrackNotification() {
	if (!getGeneral().trackNotifications) return;
	if (getState() !== 'playing') return;

	const fields = getMetadataFields();
	if (!fields) return;

	// Build a key that includes radio now-playing so song changes trigger notifications
	const np = getNowPlaying();
	const notifyKey = `${fields.id}::${np?.title ?? ''}::${np?.artist ?? ''}`;
	if (notifyKey === lastNotifiedKey) return;

	// Request permission if needed
	if (Notification.permission === 'default') {
		const result = await Notification.requestPermission();
		if (result !== 'granted') return;
	} else if (Notification.permission !== 'granted') {
		return;
	}

	lastNotifiedKey = notifyKey;

	let body = fields.artist;
	if (fields.album && fields.album !== fields.artist) {
		body += ` — ${fields.album}`;
	}

	const opts: NotificationOptions = { body };
	const artUrl = resolveArtworkUrl(fields.artwork);
	if (artUrl) {
		opts.icon = artUrl;
		// macOS Big Sur+ may show image as expandable content on long-press
		if ('image' in Notification.prototype) {
			(opts as any).image = artUrl;
		}
	}
	new Notification(fields.title, opts);
}

export function initMediaSession() {
	if (!('mediaSession' in navigator)) return;

	// Register action handlers
	const cleanupHandlers = registerActionHandlers();
	cleanupFns.push(cleanupHandlers);

	// Reactive effects for metadata, playback state, and position
	const metadataEffect = $effect.root(() => {
		$effect(() => {
			getCurrentItem();
			getNowPlaying();
			syncMetadata();
		});

		$effect(() => {
			getState();
			syncPlaybackState();
		});

		$effect(() => {
			getCurrentItem();
			getDuration();
			syncPositionState();
		});

		// Track-change notifications (also fires on radio song changes)
		$effect(() => {
			getCurrentItem();
			getNowPlaying();
			getState();
			getGeneral().trackNotifications;
			showTrackNotification();
		});
	});
	cleanupFns.push(metadataEffect);

	// Periodic position sync (every 5s)
	positionInterval = setInterval(syncPositionState, 5000);
	cleanupFns.push(() => {
		if (positionInterval) {
			clearInterval(positionInterval);
			positionInterval = null;
		}
	});
}

export function destroyMediaSession() {
	for (const fn of cleanupFns) {
		fn();
	}
	cleanupFns = [];
	lastMetadataId = null;
	lastNotifiedKey = null;
}
