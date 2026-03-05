// Thin wrapper — persisted state delegates to configStore, only presetBrowserOpen is local ephemeral.

export {
	getCurrentPresetName,
	setCurrentPreset,
	getAutoCycleEnabled,
	setAutoCycleEnabled,
	getAutoCycleIntervalSec,
	setAutoCycleIntervalSec,
	getAutoCycleMode,
	setAutoCycleMode,
	getFavoritePresets,
	toggleFavorite,
	isFavorite,
	getPresetHistory,
	getStarfieldReactivity,
	setStarfieldReactivity,
	getStarfieldBaseSpeed,
	setStarfieldBaseSpeed
} from './configStore.svelte';

// Ephemeral state — not persisted
let presetBrowserOpen = $state(false);

export function getPresetBrowserOpen(): boolean {
	return presetBrowserOpen;
}

export function togglePresetBrowser() {
	presetBrowserOpen = !presetBrowserOpen;
}

export function closePresetBrowser() {
	presetBrowserOpen = false;
}
