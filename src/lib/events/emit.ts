import { logAppEvent, type AppEvent, type AppEventType } from '$lib/stores/eventStore.svelte';

// ---------------------------------------------------------------------------
// Play events
// ---------------------------------------------------------------------------

export interface TrackPlayPayload {
	title: string;
	subtitle: string;
	imageUrl: string | null;
	entityId: string;
	backendId: string;
	artistId: string | null;
	artistName: string | null;
	albumId: string | null;
	albumName: string | null;
	durationPlayedMs: number;
}

export interface RadioPlayPayload {
	title: string;
	subtitle: string;
	imageUrl: string | null;
	entityId: string;
	backendId: string;
	streamUrl: string;
}

export interface PodcastPlayPayload {
	title: string;
	subtitle: string;
	imageUrl: string | null;
	entityId: string;
	backendId: string;
	feedUrl: string;
	audioUrl: string;
	durationPlayedMs: number;
}

export function emitTrackPlay(payload: TrackPlayPayload): void {
	logAppEvent({
		category: 'play',
		type: 'track_play',
		timestamp: new Date(),
		payload: payload as unknown as Record<string, unknown>
	});
}

export function emitRadioPlay(payload: RadioPlayPayload): void {
	logAppEvent({
		category: 'play',
		type: 'radio_play',
		timestamp: new Date(),
		payload: payload as unknown as Record<string, unknown>
	});
}

export function emitPodcastPlay(payload: PodcastPlayPayload): void {
	logAppEvent({
		category: 'play',
		type: 'podcast_play',
		timestamp: new Date(),
		payload: payload as unknown as Record<string, unknown>
	});
}

// ---------------------------------------------------------------------------
// System events — analysis
// ---------------------------------------------------------------------------

export function emitAnalysisStart(trackId: string): void {
	logAppEvent({
		category: 'system',
		type: 'analysis_start',
		timestamp: new Date(),
		payload: {
			message: 'Analyzing track',
			detail: trackId,
			level: 'info',
			operationId: `analysis-${trackId}`,
			isFinal: false
		}
	});
}

export function emitAnalysisComplete(trackId: string, bpm: number): void {
	logAppEvent({
		category: 'system',
		type: 'analysis_complete',
		timestamp: new Date(),
		payload: {
			message: `Analysis complete — ${bpm.toFixed(0)} BPM`,
			detail: trackId,
			level: 'success',
			operationId: `analysis-${trackId}`,
			isFinal: true
		}
	});
}

export function emitAnalysisError(trackId: string, error: string): void {
	logAppEvent({
		category: 'system',
		type: 'analysis_error',
		timestamp: new Date(),
		payload: {
			message: 'Analysis failed',
			detail: `${trackId}: ${error}`,
			level: 'error',
			operationId: `analysis-${trackId}`,
			isFinal: true
		}
	});
}

// ---------------------------------------------------------------------------
// Generic system events
// ---------------------------------------------------------------------------

export function emitSystemEvent(
	type: Extract<AppEventType, `system_${string}` | `sync_${string}` | `download_${string}`>,
	payload: {
		message: string;
		detail?: string;
		level: 'info' | 'success' | 'warn' | 'error';
		operationId?: string;
		progress?: number;
		isFinal?: boolean;
	}
): void {
	logAppEvent({
		category: 'system',
		type,
		timestamp: new Date(),
		payload: payload as unknown as Record<string, unknown>
	});
}

// ---------------------------------------------------------------------------
// Discovery events
// ---------------------------------------------------------------------------

export function emitDiscovery(
	type: Extract<AppEventType, 'new_album' | 'playlist_updated' | 'recommendation'>,
	payload: {
		title: string;
		subtitle?: string;
		imageUrl?: string;
		entityId?: string;
		backendId?: string;
		href?: string;
	}
): void {
	logAppEvent({
		category: 'discovery',
		type,
		timestamp: new Date(),
		payload: payload as unknown as Record<string, unknown>
	});
}
