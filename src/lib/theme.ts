import type { AppearanceConfig } from '$lib/configTypes';
import { getFontFamily } from '$lib/fonts';

// --- Color helpers (pure, no DOM dependency) ---

function hexToHsl(hex: string): [number, number, number] {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	let r: number, g: number, b: number;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h / 360 + 1 / 3);
		g = hue2rgb(p, q, h / 360);
		b = hue2rgb(p, q, h / 360 - 1 / 3);
	}
	const toHex = (v: number) =>
		Math.round(Math.min(255, Math.max(0, v * 255)))
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lighten(hex: string, amount: number): string {
	const [h, s, l] = hexToHsl(hex);
	return hslToHex(h, s, Math.min(1, l + amount));
}

export function hexToRgb(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

// --- Theme defaults ---

export const DARK_DEFAULTS = {
	bgBase: '#08080c',
	bgSurface: '#0f1014',
	bgElevated: '#16161e',
	bgHighlight: '#1e1e28',
	bgHover: '#262630',
	textPrimary: '#f0f0f0',
	textSecondary: '#a8a8b3',
	textMuted: '#5a5a6e'
};

export const LIGHT_DEFAULTS = {
	bgBase: '#f8f8fa',
	bgSurface: '#ffffff',
	bgElevated: '#f0f0f4',
	bgHighlight: '#e4e4ec',
	bgHover: '#d8d8e2',
	textPrimary: '#1a1a2e',
	textSecondary: '#5a5a72',
	textMuted: '#9898aa'
};

export const DARK_OVERLAY_BASE = '#ffffff';
export const LIGHT_OVERLAY_BASE = '#000000';
export const DARK_SCROLLBAR_BASE = '#a0a0be';
export const LIGHT_SCROLLBAR_BASE = '#000000';
export const DARK_RANGE_TRACK_BASE = '#ffffff';
export const LIGHT_RANGE_TRACK_BASE = '#000000';
export const ACCENT_SECONDARY_DEFAULT = '#e8a849';

const DARK_OVERLAYS = {
	overlay: 'rgba(255, 255, 255, 0.06)',
	overlayHover: 'rgba(255, 255, 255, 0.1)',
	overlaySubtle: 'rgba(255, 255, 255, 0.04)',
	overlayMedium: 'rgba(255, 255, 255, 0.12)',
	border: 'rgba(255, 255, 255, 0.06)',
	scrollbarThumb: 'rgba(160, 160, 190, 0.12)',
	scrollbarThumbHover: 'rgba(160, 160, 190, 0.22)',
	rangeTrack: 'rgba(255, 255, 255, 0.2)'
};

const LIGHT_OVERLAYS = {
	overlay: 'rgba(0, 0, 0, 0.05)',
	overlayHover: 'rgba(0, 0, 0, 0.08)',
	overlaySubtle: 'rgba(0, 0, 0, 0.03)',
	overlayMedium: 'rgba(0, 0, 0, 0.1)',
	border: 'rgba(0, 0, 0, 0.08)',
	scrollbarThumb: 'rgba(0, 0, 0, 0.12)',
	scrollbarThumbHover: 'rgba(0, 0, 0, 0.22)',
	rangeTrack: 'rgba(0, 0, 0, 0.15)'
};

// --- Compute theme properties ---

interface ThemeResult {
	properties: Record<string, string>;
	resolvedTheme: 'dark' | 'light';
}

/**
 * Compute all CSS custom properties from an AppearanceConfig.
 * Pure function — no DOM access. For SSR, pass resolvedTheme explicitly
 * (since we can't detect system preference on the server).
 */
export function computeThemeProperties(
	config: AppearanceConfig,
	systemTheme?: 'dark' | 'light'
): ThemeResult {
	const resolved: 'dark' | 'light' =
		config.theme === 'system' ? (systemTheme ?? 'dark') : config.theme;

	const properties: Record<string, string> = {};

	// Accent color
	const accent = config.accentColor || '#1db954';
	properties['--color-accent'] = accent;
	properties['--color-accent-hover'] = lighten(accent, 0.1);
	properties['--color-glow-accent'] = `rgba(${hexToRgb(accent)}, 0.15)`;

	// Highlight intensity
	const intensity = (config.highlightIntensity ?? 100) / 100;
	properties['--highlight-intensity'] = String(intensity);
	const rgb = hexToRgb(accent);
	properties['--color-accent-tint'] = `rgba(${rgb}, ${(0.1 * intensity).toFixed(3)})`;
	properties['--color-accent-tint-subtle'] = `rgba(${rgb}, ${(0.03 * intensity).toFixed(3)})`;
	properties['--color-accent-tint-strong'] = `rgba(${rgb}, ${(0.15 * intensity).toFixed(3)})`;
	properties['--color-accent-tint-hover'] = `rgba(${rgb}, ${(0.06 * intensity).toFixed(3)})`;

	// Compact mode
	const compact = config.compactMode;
	properties['--spacing-sidebar'] = compact ? '220px' : '260px';
	properties['--spacing-topbar'] = compact ? '48px' : '64px';
	properties['--spacing-player'] = compact ? '72px' : '90px';

	// Card scale
	const scale = (config.cardSize ?? 100) / 100;
	properties['--card-scale'] = String(scale);

	// Font
	properties['--font-family'] = getFontFamily(config.font);

	// Custom colors or theme defaults
	const colors = config.customColors;
	const def = resolved === 'light' ? LIGHT_DEFAULTS : DARK_DEFAULTS;
	properties['--color-bg-base'] = colors?.bgBase ?? def.bgBase;
	properties['--color-bg-surface'] = colors?.bgSurface ?? def.bgSurface;
	properties['--color-bg-elevated'] = colors?.bgElevated ?? def.bgElevated;
	properties['--color-bg-highlight'] = colors?.bgHighlight ?? def.bgHighlight;
	properties['--color-bg-hover'] = colors?.bgHover ?? def.bgHover;
	properties['--color-text-primary'] = colors?.textPrimary ?? def.textPrimary;
	properties['--color-text-secondary'] = colors?.textSecondary ?? def.textSecondary;
	properties['--color-text-muted'] = colors?.textMuted ?? def.textMuted;

	// Overlay & border colors
	if (colors?.overlayBase) {
		const oRgb = hexToRgb(colors.overlayBase);
		const darkAlphas = [0.06, 0.1, 0.04, 0.12, 0.06];
		const lightAlphas = [0.05, 0.08, 0.03, 0.1, 0.08];
		const alphas = resolved === 'light' ? lightAlphas : darkAlphas;
		properties['--color-overlay'] = `rgba(${oRgb}, ${alphas[0]})`;
		properties['--color-overlay-hover'] = `rgba(${oRgb}, ${alphas[1]})`;
		properties['--color-overlay-subtle'] = `rgba(${oRgb}, ${alphas[2]})`;
		properties['--color-overlay-medium'] = `rgba(${oRgb}, ${alphas[3]})`;
		properties['--color-border'] = `rgba(${oRgb}, ${alphas[4]})`;
	} else {
		const ov = resolved === 'light' ? LIGHT_OVERLAYS : DARK_OVERLAYS;
		properties['--color-overlay'] = ov.overlay;
		properties['--color-overlay-hover'] = ov.overlayHover;
		properties['--color-overlay-subtle'] = ov.overlaySubtle;
		properties['--color-overlay-medium'] = ov.overlayMedium;
		properties['--color-border'] = ov.border;
	}

	// Scrollbar
	if (colors?.scrollbarBase) {
		const sRgb = hexToRgb(colors.scrollbarBase);
		properties['--color-scrollbar-thumb'] = `rgba(${sRgb}, 0.12)`;
		properties['--color-scrollbar-thumb-hover'] = `rgba(${sRgb}, 0.22)`;
	} else {
		const ov = resolved === 'light' ? LIGHT_OVERLAYS : DARK_OVERLAYS;
		properties['--color-scrollbar-thumb'] = ov.scrollbarThumb;
		properties['--color-scrollbar-thumb-hover'] = ov.scrollbarThumbHover;
	}

	// Range track
	if (colors?.rangeTrackBase) {
		const rRgb = hexToRgb(colors.rangeTrackBase);
		const alpha = resolved === 'light' ? 0.15 : 0.2;
		properties['--color-range-track'] = `rgba(${rRgb}, ${alpha})`;
	} else {
		const ov = resolved === 'light' ? LIGHT_OVERLAYS : DARK_OVERLAYS;
		properties['--color-range-track'] = ov.rangeTrack;
	}

	// Accent secondary
	const accentSec = colors?.accentSecondary ?? ACCENT_SECONDARY_DEFAULT;
	properties['--color-accent-secondary'] = accentSec;
	properties['--color-accent-secondary-hover'] = lighten(accentSec, 0.1);

	return { properties, resolvedTheme: resolved };
}
