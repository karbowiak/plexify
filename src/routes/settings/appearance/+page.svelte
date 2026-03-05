<script lang="ts">
	import { browser } from '$app/environment';
	import type { CustomColors } from '$lib/configTypes';
	import { getAppearance, setAppearance, getVisualizerColors } from '$lib/stores/configStore.svelte';
	import {
		DARK_DEFAULTS, LIGHT_DEFAULTS,
		DARK_OVERLAY_BASE, LIGHT_OVERLAY_BASE,
		DARK_SCROLLBAR_BASE, LIGHT_SCROLLBAR_BASE,
		DARK_RANGE_TRACK_BASE, LIGHT_RANGE_TRACK_BASE,
		ACCENT_SECONDARY_DEFAULT
	} from '$lib/stores/applyTheme.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Slider from '$lib/components/ui/Slider.svelte';
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import { Play, Check, ChevronDown, Music, Disc3, ListMusic } from 'lucide-svelte';

	let config = $derived(getAppearance());

	// Local state for sliders (to avoid saving on every drag tick)
	let cardSize = $state(100);
	let highlightIntensity = $state(100);
	let slidersInitialized = false;

	// Sync local state when config changes
	$effect(() => {
		if (!slidersInitialized) {
			cardSize = config.cardSize;
			highlightIntensity = config.highlightIntensity;
			slidersInitialized = true;
		}
	});

	// Debounced save for sliders
	let sliderTimeout: ReturnType<typeof setTimeout> | undefined;
	function saveSlider(key: string, value: number) {
		clearTimeout(sliderTimeout);
		sliderTimeout = setTimeout(() => {
			setAppearance({ [key]: value });
		}, 50);
	}

	$effect(() => {
		saveSlider('cardSize', cardSize);
	});
	$effect(() => {
		saveSlider('highlightIntensity', highlightIntensity);
	});

	// Custom colors section
	let customColorsOpen = $state(false);
	let colorPickerOpen: Record<string, boolean> = $state({
		bgBase: false, bgSurface: false, bgElevated: false, bgHighlight: false,
		bgHover: false, textPrimary: false, textSecondary: false, textMuted: false,
		overlayBase: false, scrollbarBase: false, rangeTrackBase: false, accentSecondary: false
	});
	let accentPickerOpen = $state(false);
	let visLowPickerOpen = $state(false);
	let visMidPickerOpen = $state(false);
	let visHighPickerOpen = $state(false);
	let visColors = $derived(getVisualizerColors());

	const colorLabels: { key: keyof CustomColors; label: () => string; cssVar: string }[] = [
		{ key: 'bgBase', label: () => m.appearance_bg_base(), cssVar: '--color-bg-base' },
		{ key: 'bgSurface', label: () => m.appearance_bg_surface(), cssVar: '--color-bg-surface' },
		{ key: 'bgElevated', label: () => m.appearance_bg_elevated(), cssVar: '--color-bg-elevated' },
		{ key: 'bgHighlight', label: () => m.appearance_color_highlight(), cssVar: '--color-bg-highlight' },
		{ key: 'bgHover', label: () => m.appearance_color_hover(), cssVar: '--color-bg-hover' },
		{ key: 'textPrimary', label: () => m.appearance_color_primary_text(), cssVar: '--color-text-primary' },
		{ key: 'textSecondary', label: () => m.appearance_color_secondary_text(), cssVar: '--color-text-secondary' },
		{ key: 'textMuted', label: () => m.appearance_color_muted_text(), cssVar: '--color-text-muted' }
	];

	let resolvedTheme = $derived(
		config.theme === 'system'
			? (browser ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'dark')
			: config.theme
	);

	let defaultColors = $derived(resolvedTheme === 'light' ? LIGHT_DEFAULTS : DARK_DEFAULTS);

	let systemColorDefaults = $derived({
		overlayBase: resolvedTheme === 'light' ? LIGHT_OVERLAY_BASE : DARK_OVERLAY_BASE,
		scrollbarBase: resolvedTheme === 'light' ? LIGHT_SCROLLBAR_BASE : DARK_SCROLLBAR_BASE,
		rangeTrackBase: resolvedTheme === 'light' ? LIGHT_RANGE_TRACK_BASE : DARK_RANGE_TRACK_BASE,
		accentSecondary: ACCENT_SECONDARY_DEFAULT
	});

	function getCustomColor(key: keyof CustomColors): string {
		const val = config.customColors?.[key];
		if (val) return val;
		if (key in defaultColors) return defaultColors[key as keyof typeof defaultColors];
		return systemColorDefaults[key as keyof typeof systemColorDefaults] ?? '#000000';
	}

	function setCustomColor(key: keyof CustomColors, value: string) {
		const current: CustomColors = config.customColors ?? {
			bgBase: null, bgSurface: null, bgElevated: null, bgHighlight: null,
			bgHover: null, textPrimary: null, textSecondary: null, textMuted: null,
			overlayBase: null, scrollbarBase: null, rangeTrackBase: null, accentSecondary: null
		};
		setAppearance({
			customColors: { ...current, [key]: value }
		});
	}

	const systemColorLabels: { key: keyof CustomColors; label: () => string; description: () => string }[] = [
		{ key: 'overlayBase', label: () => m.appearance_color_overlay(), description: () => m.appearance_color_overlay_desc() },
		{ key: 'scrollbarBase', label: () => m.appearance_color_scrollbar(), description: () => m.appearance_color_scrollbar_desc() },
		{ key: 'rangeTrackBase', label: () => m.appearance_color_range_track(), description: () => m.appearance_color_range_track_desc() },
		{ key: 'accentSecondary', label: () => m.appearance_color_accent_secondary(), description: () => m.appearance_color_accent_secondary_desc() }
	];

	function resetCustomColors() {
		setAppearance({ customColors: null });
	}

	// Data
	const themes = [
		{ label: () => m.appearance_theme_dark(), value: 'dark' as const },
		{ label: () => m.appearance_theme_light(), value: 'light' as const },
		{ label: () => m.appearance_theme_system(), value: 'system' as const }
	];

	const fonts = ['System', 'Inter', 'Geist', 'Montserrat', 'Nunito'];

	const fontFamilies: Record<string, string> = {
		System: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		Inter: "'Inter', sans-serif",
		Geist: "'Geist', sans-serif",
		Montserrat: "'Montserrat', sans-serif",
		Nunito: "'Nunito', sans-serif"
	};

	const accentColors = [
		{ label: () => m.color_emerald(), value: '#10b981' },
		{ label: () => m.color_green(), value: '#1db954' },
		{ label: () => m.color_blue(), value: '#3b82f6' },
		{ label: () => m.color_cobalt(), value: '#2563eb' },
		{ label: () => m.color_cyan(), value: '#06b6d4' },
		{ label: () => m.color_purple(), value: '#8b5cf6' },
		{ label: () => m.color_magenta(), value: '#d946ef' },
		{ label: () => m.color_pink(), value: '#ec4899' },
		{ label: () => m.color_orange(), value: '#f97316' },
		{ label: () => m.color_amber(), value: '#f59e0b' },
		{ label: () => m.color_rose(), value: '#f43f5e' },
		{ label: () => m.color_red(), value: '#ef4444' }
	];

	// Computed preview values
	let accentRgb = $derived(() => {
		const hex = config.accentColor;
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `${r}, ${g}, ${b}`;
	});

	let tintOpacity = $derived((highlightIntensity / 100) * 0.1);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">{m.appearance_title()}</h1>

	<!-- Theme Selector -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_theme()}</h2>
		<div class="px-6 pb-5">
			<div class="flex gap-2">
				{#each themes as t}
					<button
						onclick={() => setAppearance({ theme: t.value })}
						class="rounded-lg px-5 py-2 text-sm font-medium transition-all {config.theme === t.value
							? 'bg-accent text-bg-base shadow-lg shadow-glow-accent'
							: 'bg-overlay text-text-secondary hover:bg-overlay-hover hover:text-text-primary'}"
					>
						{t.label()}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Font Selector -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_font()}</h2>
		<div class="px-6 pb-5">
			<div class="flex flex-wrap gap-2">
				{#each fonts as f}
					<button
						onclick={() => setAppearance({ font: f })}
						style="font-family: {fontFamilies[f]}"
						class="rounded-lg px-5 py-2 text-sm font-medium transition-all {config.font === f
							? 'bg-accent text-bg-base shadow-lg shadow-glow-accent'
							: 'bg-overlay text-text-secondary hover:bg-overlay-hover hover:text-text-primary'}"
					>
						{f}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Accent Colour -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_accent_colour()}</h2>
		<div class="space-y-4 px-6 pb-5">
			<!-- Color swatches + hex input -->
			<div class="flex items-center gap-3">
				{#each accentColors as color}
					<button
						aria-label={m.aria_set_accent({ color: color.label() })}
						title={color.label()}
						onclick={() => setAppearance({ accentColor: color.value })}
						class="relative h-9 w-9 shrink-0 rounded-full transition-transform hover:scale-110"
						style="background-color: {color.value}"
					>
						{#if config.accentColor === color.value}
							<span class="absolute inset-0 flex items-center justify-center rounded-full ring-2 ring-white ring-offset-2 ring-offset-bg-elevated">
								<Check size={14} class="text-white drop-shadow-md" />
							</span>
						{/if}
					</button>
				{/each}

				<!-- Divider -->
				<div class="h-6 w-px shrink-0 bg-border"></div>

				<!-- Custom color picker -->
				<ColorPicker
					value={config.accentColor}
					onchange={(hex) => setAppearance({ accentColor: hex })}
					bind:open={accentPickerOpen}
					label="hex"
				/>
			</div>

			<!-- Accent preview bar -->
			<div class="rounded-lg bg-overlay-subtle p-4">
				<p class="mb-3 text-xs font-medium text-text-muted">{m.appearance_preview()}</p>
				<div class="flex items-center gap-4">
					<button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-lg" style="background-color: {config.accentColor}">
						<Play size={16} fill="currentColor" class="text-bg-base" />
					</button>
					<div class="flex-1">
						<div class="mb-1 h-1 w-full overflow-hidden rounded-full bg-overlay-medium">
							<div class="h-full w-2/3 rounded-full" style="background-color: {config.accentColor}"></div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium" style="color: {config.accentColor}">{m.appearance_now_playing()}</span>
							<span class="rounded-full px-3 py-0.5 text-xs font-semibold text-bg-base" style="background-color: {config.accentColor}">{m.appearance_active()}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Card Size -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_card_size()}</h2>
		<div class="space-y-3 px-6 pb-5">
			<div class="flex items-center gap-4">
				<span class="text-xs text-text-muted">{m.appearance_small()}</span>
				<Slider bind:value={cardSize} min={80} max={200} step={5} class="flex-1" />
				<span class="text-xs text-text-muted">{m.appearance_large()}</span>
				<span class="w-14 text-right text-sm font-medium text-text-secondary">{Math.round(160 * cardSize / 100)}px</span>
			</div>
		</div>
	</div>

	<!-- Highlight Intensity -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_highlight_intensity()}</h2>
		<div class="space-y-4 px-6 pb-5">
			<div class="flex items-center gap-4">
				<span class="text-xs text-text-muted">{m.appearance_subtle()}</span>
				<Slider bind:value={highlightIntensity} min={0} max={200} step={5} class="flex-1" />
				<span class="text-xs text-text-muted">{m.appearance_vivid()}</span>
				<span class="w-12 text-right text-sm font-medium text-text-secondary">{highlightIntensity}%</span>
			</div>

			<!-- Live preview -->
			<div class="space-y-2 rounded-lg bg-overlay-subtle p-4">
				<p class="mb-3 text-xs font-medium text-text-muted">{m.appearance_preview()}</p>

				<!-- Card hover -->
				<div
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
					style="background-color: rgba({accentRgb()}, {tintOpacity})"
				>
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-overlay-medium">
						<Disc3 size={14} class="text-text-secondary" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-text-primary">{m.appearance_card_hover()}</p>
						<p class="truncate text-xs text-text-secondary">{m.appearance_hover_preview()}</p>
					</div>
				</div>

				<!-- Track row -->
				<div
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
					style="background-color: rgba({accentRgb()}, {tintOpacity * 0.7})"
				>
					<span class="w-5 text-center text-xs text-text-muted">1</span>
					<div class="h-8 w-8 shrink-0 rounded bg-overlay-medium"></div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm text-text-primary">{m.appearance_track_highlight()}</p>
					</div>
					<span class="text-xs text-text-muted">3:42</span>
				</div>

				<!-- Menu item -->
				<div
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
					style="background-color: rgba({accentRgb()}, {tintOpacity * 1.2})"
				>
					<Play size={14} class="text-text-secondary" />
					<span class="text-sm text-text-primary">{m.appearance_menu_item()}</span>
				</div>

				<!-- Queue item -->
				<div
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
					style="background-color: rgba({accentRgb()}, {tintOpacity * 0.5})"
				>
					<div class="h-8 w-8 shrink-0 rounded bg-overlay-medium"></div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm text-text-primary">{m.appearance_queue_item()}</p>
						<p class="truncate text-xs text-text-muted">{m.appearance_artist_name()}</p>
					</div>
					<ListMusic size={14} class="text-text-muted" />
				</div>
			</div>
		</div>
	</div>

	<!-- Visualizer Colors -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.appearance_visualizer_colors()}</h2>
		<div class="space-y-4 px-6 pb-5">
			<p class="text-xs text-text-secondary">{m.appearance_visualizer_colors_desc()}</p>
			<div class="flex items-center gap-6">
				<div class="flex items-center gap-2">
					<span class="text-xs text-text-muted">{m.appearance_low()}</span>
					<ColorPicker
						value={visColors.low}
						onchange={(hex) => setAppearance({ visualizerColors: { ...visColors, low: hex } })}
						bind:open={visLowPickerOpen}
						label="hex"
					/>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs text-text-muted">{m.appearance_mid()}</span>
					<ColorPicker
						value={visColors.mid}
						onchange={(hex) => setAppearance({ visualizerColors: { ...visColors, mid: hex } })}
						bind:open={visMidPickerOpen}
						label="hex"
					/>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs text-text-muted">{m.appearance_high()}</span>
					<ColorPicker
						value={visColors.high}
						onchange={(hex) => setAppearance({ visualizerColors: { ...visColors, high: hex } })}
						bind:open={visHighPickerOpen}
						label="hex"
					/>
				</div>
			</div>

			<!-- Gradient preview -->
			<div class="h-3 w-full rounded-full" style="background: linear-gradient(to right, {visColors.low} 0%, {visColors.mid} 50%, {visColors.high} 100%)"></div>

			{#if config.visualizerColors !== null}
				<button
					onclick={() => setAppearance({ visualizerColors: null })}
					class="rounded-lg bg-overlay px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-overlay-hover hover:text-text-primary"
				>
					{m.appearance_reset_defaults()}
				</button>
			{/if}
		</div>
	</div>

	<!-- Compact Mode -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<div class="flex items-center justify-between px-6 py-5">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.appearance_compact_mode()}</p>
				<p class="text-xs text-text-secondary">{m.appearance_compact_mode_desc()}</p>
			</div>
			<button
				aria-label={m.aria_toggle_compact()}
				onclick={() => setAppearance({ compactMode: !config.compactMode })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.compactMode ? 'bg-accent' : 'bg-overlay-medium'}"
			>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.compactMode ? 'translate-x-5' : ''}"></span>
			</button>
		</div>
	</div>

	<!-- Customize Colors -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<button
			onclick={() => (customColorsOpen = !customColorsOpen)}
			class="flex w-full items-center justify-between px-6 py-5 text-left"
		>
			<div>
				<p class="text-sm font-medium text-text-primary">{m.appearance_customize_colors()}</p>
				<p class="text-xs text-text-secondary">{m.appearance_customize_colors_desc()}</p>
			</div>
			<ChevronDown
				size={18}
				class="text-text-muted transition-transform {customColorsOpen ? 'rotate-180' : ''}"
			/>
		</button>

		{#if customColorsOpen}
			<div class="border-t border-border px-6 pt-4 pb-5">
				<!-- Theme Colors -->
				<div class="space-y-3">
					{#each colorLabels as { key, label }}
						<div class="flex items-center gap-3">
							<span class="min-w-0 flex-1 text-sm text-text-secondary">{label()}</span>
							<ColorPicker
								value={getCustomColor(key)}
								onchange={(hex) => setCustomColor(key, hex)}
								bind:open={colorPickerOpen[key]}
								label="hex"
							/>
						</div>
					{/each}
				</div>

				<!-- System Colors -->
				<div class="mt-5 border-t border-border pt-4">
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{m.appearance_system_colors()}</h3>
					<div class="space-y-3">
						{#each systemColorLabels as { key, label, description }}
							<div class="flex items-center gap-3">
								<div class="min-w-0 flex-1">
									<span class="text-sm text-text-secondary">{label()}</span>
									<p class="text-xs text-text-muted">{description()}</p>
								</div>
								<ColorPicker
									value={getCustomColor(key)}
									onchange={(hex) => setCustomColor(key, hex)}
									bind:open={colorPickerOpen[key]}
									label="hex"
								/>
							</div>
						{/each}
					</div>
				</div>

				<button
					onclick={resetCustomColors}
					class="mt-4 rounded-lg bg-overlay px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-overlay-hover hover:text-text-primary"
				>
					{m.appearance_reset_defaults()}
				</button>
			</div>
		{/if}
	</div>
</div>
