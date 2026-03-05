import { browser } from '$app/environment';
import {
	defaults,
	type GeneralConfig,
	type BackendsConfig,
	type BackendInstanceConfig,
	type MetadataConfig,
	type PlaybackConfig,
	type VolumeConfig,
	type EQConfig,
	type AppearanceConfig,
	type CachesConfig,
	type CacheConfig,
	type UiConfig,
	type VisualizerConfig,
	type AppConfig,
	type RepeatMode,
	type SidePanel,
	type CompactVisMode,
	type FullscreenVisMode,
	type VisualizerColors,
	type CustomColors,
	DEFAULT_IMAGE_CACHE,
	CACHE_DEFAULTS,
	UI_DEFAULTS,
	VISUALIZER_DEFAULTS
} from '$lib/configTypes';


// ---------------------------------------------------------------------------
// Reactive state — initialized with defaults, overwritten by initFromServer()
// ---------------------------------------------------------------------------

let general = $state<GeneralConfig>(defaults.general);
let backends = $state<BackendsConfig>(defaults.backends);
let metadata = $state<MetadataConfig>(defaults.metadata);
let playback = $state<PlaybackConfig>(defaults.playback);
let appearance = $state<AppearanceConfig>(defaults.appearance);
let caches = $state<CachesConfig>(defaults.caches);
let ui = $state<UiConfig>(defaults.ui);
let visualizer = $state<VisualizerConfig>(defaults.visualizer);

// ---------------------------------------------------------------------------
// Server initialization — called once from +layout.svelte with SSR data
// ---------------------------------------------------------------------------

export function initFromServer(config: AppConfig) {
	general = config.general;
	backends = config.backends;
	metadata = config.metadata;
	playback = config.playback;
	appearance = config.appearance;
	caches = config.caches;
	ui = config.ui;
	visualizer = config.visualizer;
}

// ---------------------------------------------------------------------------
// Debounced persist to server
// ---------------------------------------------------------------------------

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function persistSection(section: string, value: unknown) {
	if (!browser) return;
	clearTimeout(pending.get(section));
	pending.set(
		section,
		setTimeout(() => {
			pending.delete(section);
			fetch('/api/config', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ section, value })
			});
		}, 150)
	);
}

// ---------------------------------------------------------------------------
// General
// ---------------------------------------------------------------------------

export function getGeneral(): GeneralConfig {
	return general;
}

export function setGeneral(patch: Partial<GeneralConfig>) {
	general = { ...general, ...patch };
	persistSection('general', general);
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

export function getBackends(): BackendsConfig {
	return backends;
}

export function getBackendConfig(id: string): BackendInstanceConfig {
	return backends[id] ?? { enabled: false, config: {} };
}

export function hasBackendConfig(id: string): boolean {
	return id in backends;
}

export function setBackend(id: string, patch: Partial<BackendInstanceConfig>) {
	const current = getBackendConfig(id);
	backends = {
		...backends,
		[id]: {
			enabled: patch.enabled ?? current.enabled,
			config: patch.config ? { ...current.config, ...patch.config } : current.config
		}
	};
	persistSection('backends', backends);
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export function getMetadata(): MetadataConfig {
	return metadata;
}

export function setMetadata(patch: Partial<MetadataConfig>) {
	metadata = { ...metadata, ...patch };
	persistSection('metadata', metadata);
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export function getPlayback(): PlaybackConfig {
	return playback;
}

export function setPlayback(patch: Partial<PlaybackConfig>) {
	playback = { ...playback, ...patch };
	persistSection('playback', playback);
}

// Volume
export function getVolume(): VolumeConfig {
	return playback.volume;
}

export function setVolume(patch: Partial<VolumeConfig>) {
	playback = { ...playback, volume: { ...playback.volume, ...patch } };
	persistSection('playback', playback);
}

// EQ
export function getEQ(): EQConfig {
	return playback.eq;
}

export function setEQ(patch: Partial<EQConfig>) {
	playback = { ...playback, eq: { ...playback.eq, ...patch } };
	persistSection('playback', playback);
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

export function getAppearance(): AppearanceConfig {
	return appearance;
}

export function setAppearance(patch: Partial<AppearanceConfig>) {
	appearance = { ...appearance, ...patch };
	persistSection('appearance', appearance);
}

const VISUALIZER_COLOR_DEFAULTS: VisualizerColors = { low: '#22c55e', mid: '#eab308', high: '#ef4444' };

export function getVisualizerColors(): VisualizerColors {
	return appearance.visualizerColors ?? VISUALIZER_COLOR_DEFAULTS;
}

export function getVisualizerColorDefaults(): VisualizerColors {
	return VISUALIZER_COLOR_DEFAULTS;
}

// ---------------------------------------------------------------------------
// Caches (keyed by provider id)
// ---------------------------------------------------------------------------

export function getCaches(): CachesConfig {
	return caches;
}

export function getCache(id: string = 'image'): CacheConfig {
	return caches[id] ?? CACHE_DEFAULTS[id] ?? DEFAULT_IMAGE_CACHE;
}

export function setCache(id: string, patch: Partial<CacheConfig>): void;
export function setCache(patch: Partial<CacheConfig>): void;
export function setCache(idOrPatch: string | Partial<CacheConfig>, maybePatch?: Partial<CacheConfig>) {
	let id: string;
	let patch: Partial<CacheConfig>;
	if (typeof idOrPatch === 'string') {
		id = idOrPatch;
		patch = maybePatch!;
	} else {
		id = 'image';
		patch = idOrPatch;
	}
	const current = caches[id] ?? CACHE_DEFAULTS[id] ?? DEFAULT_IMAGE_CACHE;
	caches = { ...caches, [id]: { ...current, ...patch } };
	persistSection('caches', caches);
}

// ---------------------------------------------------------------------------
// Repeat
// ---------------------------------------------------------------------------

export function getRepeatMode(): RepeatMode {
	return playback.repeatMode;
}

const repeatCycle: RepeatMode[] = ['off', 'all', 'one'];
export function cycleRepeatMode() {
	const idx = repeatCycle.indexOf(playback.repeatMode);
	playback = { ...playback, repeatMode: repeatCycle[(idx + 1) % repeatCycle.length] };
	persistSection('playback', playback);
}

// ---------------------------------------------------------------------------
// Shuffle
// ---------------------------------------------------------------------------

export function getShuffled(): boolean {
	return playback.shuffled;
}

export function setShuffled(value: boolean) {
	playback = { ...playback, shuffled: value };
	persistSection('playback', playback);
}

// ---------------------------------------------------------------------------
// Debug
// ---------------------------------------------------------------------------

export function getDebugEnabled(): boolean {
	return general.debugEnabled;
}

export function setDebugEnabled(value: boolean) {
	general = { ...general, debugEnabled: value };
	persistSection('general', general);
}

// ---------------------------------------------------------------------------
// UI (persisted state only)
// ---------------------------------------------------------------------------

export function getSidePanel(): SidePanel {
	return ui.sidePanel;
}

export function toggleQueue() {
	ui = { ...ui, sidePanel: ui.sidePanel === 'queue' ? null : 'queue' };
	persistSection('ui', ui);
}

export function toggleLyrics() {
	ui = { ...ui, sidePanel: ui.sidePanel === 'lyrics' ? null : 'lyrics' };
	persistSection('ui', ui);
}

export function setSidePanel(tab: 'queue' | 'lyrics') {
	ui = { ...ui, sidePanel: tab };
	persistSection('ui', ui);
}

export function closeSidePanel() {
	ui = { ...ui, sidePanel: null };
	persistSection('ui', ui);
}

export function getArtExpanded(): boolean {
	return ui.artExpanded;
}

export function toggleArtExpanded() {
	ui = { ...ui, artExpanded: !ui.artExpanded };
	persistSection('ui', ui);
}

export function setArtExpanded(value: boolean) {
	ui = { ...ui, artExpanded: value };
	persistSection('ui', ui);
}

export function getVisualizerMode(): CompactVisMode {
	return ui.visualizerMode;
}

export function setVisualizerMode(mode: CompactVisMode) {
	ui = { ...ui, visualizerMode: mode };
	persistSection('ui', ui);
}

const visModeCycle: CompactVisMode[] = ['off', 'spectrum', 'oscilloscope', 'vu'];
export function cycleVisualizerMode() {
	const idx = visModeCycle.indexOf(ui.visualizerMode);
	ui = { ...ui, visualizerMode: visModeCycle[(idx + 1) % visModeCycle.length] };
	persistSection('ui', ui);
}

export function getFullscreenVisMode(): FullscreenVisMode {
	return ui.fullscreenVisMode;
}

export function setFullscreenVisMode(mode: FullscreenVisMode) {
	ui = { ...ui, fullscreenVisMode: mode };
	persistSection('ui', ui);
}

// ---------------------------------------------------------------------------
// Visualizer (persisted state only)
// ---------------------------------------------------------------------------

const VISUALIZER_HISTORY_CAP = 50;

export function getVisualizer(): VisualizerConfig {
	return visualizer;
}

export function setVisualizer(patch: Partial<VisualizerConfig>) {
	visualizer = { ...visualizer, ...patch };
	persistSection('visualizer', visualizer);
}

export function getCurrentPresetName(): string | null {
	return visualizer.currentPresetName;
}

export function setCurrentPreset(name: string) {
	visualizer = {
		...visualizer,
		currentPresetName: name,
		presetHistory: [name, ...visualizer.presetHistory.filter((n) => n !== name)].slice(
			0,
			VISUALIZER_HISTORY_CAP
		)
	};
	persistSection('visualizer', visualizer);
}

export function getAutoCycleEnabled(): boolean {
	return visualizer.autoCycleEnabled;
}

export function setAutoCycleEnabled(v: boolean) {
	visualizer = { ...visualizer, autoCycleEnabled: v };
	persistSection('visualizer', visualizer);
}

export function getAutoCycleIntervalSec(): number {
	return visualizer.autoCycleIntervalSec;
}

export function setAutoCycleIntervalSec(v: number) {
	visualizer = { ...visualizer, autoCycleIntervalSec: v };
	persistSection('visualizer', visualizer);
}

export function getAutoCycleMode(): 'random' | 'sequential' {
	return visualizer.autoCycleMode;
}

export function setAutoCycleMode(v: 'random' | 'sequential') {
	visualizer = { ...visualizer, autoCycleMode: v };
	persistSection('visualizer', visualizer);
}

export function getFavoritePresets(): string[] {
	return visualizer.favoritePresets;
}

export function toggleFavorite(name: string) {
	if (visualizer.favoritePresets.includes(name)) {
		visualizer = {
			...visualizer,
			favoritePresets: visualizer.favoritePresets.filter((n) => n !== name)
		};
	} else {
		visualizer = { ...visualizer, favoritePresets: [...visualizer.favoritePresets, name] };
	}
	persistSection('visualizer', visualizer);
}

export function isFavorite(name: string): boolean {
	return visualizer.favoritePresets.includes(name);
}

export function getPresetHistory(): string[] {
	return visualizer.presetHistory;
}

export function getStarfieldReactivity(): number {
	return visualizer.starfieldReactivity;
}

export function setStarfieldReactivity(n: number) {
	visualizer = { ...visualizer, starfieldReactivity: Math.max(0, Math.min(100, n)) };
	persistSection('visualizer', visualizer);
}

export function getStarfieldBaseSpeed(): number {
	return visualizer.starfieldBaseSpeed;
}

export function setStarfieldBaseSpeed(n: number) {
	visualizer = { ...visualizer, starfieldBaseSpeed: Math.max(1, Math.min(10, n)) };
	persistSection('visualizer', visualizer);
}
