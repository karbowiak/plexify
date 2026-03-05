// ---------------------------------------------------------------------------
// UI Config
// ---------------------------------------------------------------------------

export type SidePanel = 'queue' | 'lyrics' | null;
export type CompactVisMode = 'spectrum' | 'oscilloscope' | 'vu' | 'off';
export type FullscreenVisMode = 'spectrum' | 'oscilloscope' | 'vu' | 'starfield' | 'milkdrop';

export interface UiConfig {
	sidePanel: SidePanel;
	artExpanded: boolean;
	visualizerMode: CompactVisMode;
	fullscreenVisMode: FullscreenVisMode;
}

// ---------------------------------------------------------------------------
// Visualizer Config
// ---------------------------------------------------------------------------

export interface VisualizerConfig {
	currentPresetName: string | null;
	autoCycleEnabled: boolean;
	autoCycleIntervalSec: number;
	autoCycleMode: 'random' | 'sequential';
	favoritePresets: string[];
	presetHistory: string[];
	starfieldReactivity: number;
	starfieldBaseSpeed: number;
}

export interface CacheConfig {
	directory: string;
	maxSizeMB: number;
	ttlDays: number;
}

export type CachesConfig = Record<string, CacheConfig>;

export interface GeneralConfig {
	language: string;
	startPage: string;
	animationsEnabled: boolean;
	trackNotifications: boolean;
	debugEnabled: boolean;
	activeBackendId: string | null;
}

export interface BackendInstanceConfig {
	enabled: boolean;
	config: Record<string, unknown>;
}

export type BackendsConfig = Record<string, BackendInstanceConfig>;

export interface MetadataConfig {
	preferredSource: string;
}

export interface VolumeConfig {
	level: number;
	muted: boolean;
	preMuteLevel: number;
}

export interface EQConfig {
	enabled: boolean;
	preset: string;
	bands: number[];
	preampDb: number;
	postgainDb: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlaybackConfig {
	crossfadeEnabled: boolean;
	crossfadeDuration: number;
	smartCrossfade: boolean;
	sameAlbumCrossfade: boolean;
	gaplessPlayback: boolean;
	normalizeVolume: boolean;
	visualizerEnabled: boolean;
	volume: VolumeConfig;
	eq: EQConfig;
	repeatMode: RepeatMode;
	shuffled: boolean;
}

export interface CustomColors {
	bgBase: string | null;
	bgSurface: string | null;
	bgElevated: string | null;
	bgHighlight: string | null;
	bgHover: string | null;
	textPrimary: string | null;
	textSecondary: string | null;
	textMuted: string | null;
	overlayBase: string | null;
	scrollbarBase: string | null;
	rangeTrackBase: string | null;
	accentSecondary: string | null;
}

export interface VisualizerColors {
	low: string;
	mid: string;
	high: string;
}

export interface AppearanceConfig {
	theme: 'dark' | 'light' | 'system';
	font: string;
	accentColor: string;
	cardSize: number;
	highlightIntensity: number;
	compactMode: boolean;
	customColors: CustomColors | null;
	visualizerColors: VisualizerColors | null;
}

export interface AppConfig {
	general: GeneralConfig;
	backends: BackendsConfig;
	metadata: MetadataConfig;
	playback: PlaybackConfig;
	appearance: AppearanceConfig;
	caches: CachesConfig;
	ui: UiConfig;
	visualizer: VisualizerConfig;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_IMAGE_CACHE: CacheConfig = {
	directory: '.cache/img',
	maxSizeMB: 500,
	ttlDays: 7
};

export const DEFAULT_MEDIA_CACHE: CacheConfig = {
	directory: '.cache/media',
	maxSizeMB: 2048,
	ttlDays: 30
};

export const CACHE_DEFAULTS: Record<string, CacheConfig> = {
	image: DEFAULT_IMAGE_CACHE,
	media: DEFAULT_MEDIA_CACHE
};

export const UI_DEFAULTS: UiConfig = {
	sidePanel: null,
	artExpanded: false,
	visualizerMode: 'spectrum',
	fullscreenVisMode: 'spectrum'
};

export const VISUALIZER_DEFAULTS: VisualizerConfig = {
	currentPresetName: null,
	autoCycleEnabled: true,
	autoCycleIntervalSec: 45,
	autoCycleMode: 'random',
	favoritePresets: [],
	presetHistory: [],
	starfieldReactivity: 50,
	starfieldBaseSpeed: 3
};

export const defaults: AppConfig = {
	general: {
		language: 'en',
		startPage: '/',
		animationsEnabled: true,
		trackNotifications: false,
		debugEnabled: false,
		activeBackendId: null
	},
	backends: {
		demo: { enabled: true, config: {} },
		'radio-browser': { enabled: true, config: {} },
		'podcast-index': { enabled: true, config: {} }
	},
	metadata: {
		preferredSource: 'plex'
	},
	playback: {
		crossfadeEnabled: false,
		crossfadeDuration: 5,
		smartCrossfade: true,
		sameAlbumCrossfade: false,
		gaplessPlayback: true,
		normalizeVolume: false,
		visualizerEnabled: false,
		volume: { level: 70, muted: false, preMuteLevel: 70 },
		eq: {
			enabled: true,
			preset: 'flat',
			bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			preampDb: 0,
			postgainDb: 0
		},
		repeatMode: 'off',
		shuffled: false
	},
	appearance: {
		theme: 'dark',
		font: 'System',
		accentColor: '#1db954',
		cardSize: 100,
		highlightIntensity: 100,
		compactMode: false,
		customColors: null,
		visualizerColors: null
	},
	caches: {
		image: DEFAULT_IMAGE_CACHE,
		media: DEFAULT_MEDIA_CACHE
	},
	ui: UI_DEFAULTS,
	visualizer: VISUALIZER_DEFAULTS
};
