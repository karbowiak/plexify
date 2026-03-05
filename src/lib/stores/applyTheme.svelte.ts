import { getAppearance } from './configStore.svelte';
import { computeThemeProperties } from '$lib/theme';

// Re-export constants that other files may import from here
export {
	DARK_DEFAULTS,
	LIGHT_DEFAULTS,
	DARK_OVERLAY_BASE,
	LIGHT_OVERLAY_BASE,
	DARK_SCROLLBAR_BASE,
	LIGHT_SCROLLBAR_BASE,
	DARK_RANGE_TRACK_BASE,
	LIGHT_RANGE_TRACK_BASE,
	ACCENT_SECONDARY_DEFAULT
} from '$lib/theme';

// --- System theme detection (DOM-only) ---
function getSystemTheme(): 'dark' | 'light' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

// --- Apply ---
export function applyTheme() {
	const config = getAppearance();

	// System theme listener
	if (mediaListener && mediaQuery) {
		mediaQuery.removeEventListener('change', mediaListener);
		mediaListener = null;
	}
	if (config.theme === 'system') {
		mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaListener = () => applyTheme();
		mediaQuery.addEventListener('change', mediaListener);
	}

	const systemTheme = getSystemTheme();
	const { properties, resolvedTheme } = computeThemeProperties(config, systemTheme);

	const el = document.documentElement;
	el.dataset.theme = resolvedTheme;

	for (const [prop, value] of Object.entries(properties)) {
		el.style.setProperty(prop, value);
	}
}
