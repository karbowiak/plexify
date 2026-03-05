export type PlaybackState = 'stopped' | 'buffering' | 'playing' | 'paused';

export interface EngineCallbacks {
	onPosition(positionMs: number, durationMs: number): void;
	onState(state: PlaybackState): void;
	onTrackStarted(trackId: string, durationMs?: number): void;
	onTrackEnded(trackId: string): void;
	onError(message: string): void;
	onVisFrame?(samples: Float32Array): void;
	onAnalysisStart?(trackId: string): void;
	onAnalysisComplete?(trackId: string, bpm: number): void;
	onAnalysisError?(trackId: string, error: string): void;
}

export interface TrackAnalysis {
	trackId: string;
	audioStartMs: number;
	audioEndMs: number;
	outroStartMs: number;
	introEndMs: number;
	medianEnergy: number;
	bpm: number;
}

export interface DeckDebugInfo {
	trackId: string;
	durationMs: number;
	albumId: string;
	gainDb: number | null;
	normGainValue: number;
	currentTimeSec: number;
	paused: boolean;
	readyState: number;
	networkState: number;
	isStream: boolean;
	hasStartedPlaying: boolean;
}

export interface EngineDebugInfo {
	contextState: string | null;
	contextSampleRate: number | null;
	activeDeck: DeckDebugInfo | null;
	preloadedDeck: DeckDebugInfo | null;
	normalizationEnabled: boolean;
	crossfadeWindowMs: number;
	smartCrossfadeEnabled: boolean;
	sameAlbumCrossfade: boolean;
	isCrossfading: boolean;
	eqEnabled: boolean;
	eqGains: number[];
	preampDb: number;
	postgainDb: number;
	volume: number;
	visEnabled: boolean;
	analysisCacheSize: number;
	analysisQueueLength: number;
	playGeneration: number;
}

export interface PlayRequest {
	url: string;
	trackId: string;
	durationMs: number;
	albumId: string;
	gainDb: number | null;
	skipCrossfade?: boolean;
	/** True for infinite streams (radio). Disables seek, preload, crossfade. */
	isStream?: boolean;
}
