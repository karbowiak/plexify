<script lang="ts">
	import { getPlayback, setPlayback } from '$lib/stores/configStore.svelte';
	import { syncConfig } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let config = $derived(getPlayback());

	function updatePlayback(patch: Parameters<typeof setPlayback>[0]) {
		setPlayback(patch);
		syncConfig();
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">{m.playback_title()}</h1>

	<!-- Card 1: Crossfade -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.playback_crossfade()}</h2>

		<div class="flex items-center justify-between px-6 py-4">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.playback_crossfade()}</p>
				<p class="text-xs text-text-secondary">{m.playback_crossfade_desc()}</p>
			</div>
			<button
				aria-label={m.aria_toggle_crossfade()}
				onclick={() => updatePlayback({ crossfadeEnabled: !config.crossfadeEnabled })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.crossfadeEnabled
					? 'bg-accent'
					: 'bg-overlay-medium'}"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.crossfadeEnabled
						? 'translate-x-5'
						: ''}"
				></span>
			</button>
		</div>

		{#if config.crossfadeEnabled}
			<div class="px-6 pb-4">
				<label for="crossfadeDuration" class="block text-xs text-text-secondary">
					{m.playback_duration({ seconds: config.crossfadeDuration })}
				</label>
				<input
					id="crossfadeDuration"
					type="range"
					min="1"
					max="12"
					step="1"
					value={config.crossfadeDuration}
					oninput={(e) =>
						updatePlayback({ crossfadeDuration: Number(e.currentTarget.value) })}
					class="mt-1 w-full max-w-xs"
				/>
			</div>

			<div class="mx-6 h-px bg-border"></div>

			<div class="flex items-center justify-between px-6 py-4">
				<div>
					<p class="text-sm font-medium text-text-primary">{m.playback_smart_crossfade()}</p>
					<p class="text-xs text-text-secondary">{m.playback_smart_crossfade_desc()}</p>
				</div>
				<button
					aria-label={m.aria_toggle_smart_crossfade()}
					onclick={() => updatePlayback({ smartCrossfade: !config.smartCrossfade })}
					class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.smartCrossfade
						? 'bg-accent'
						: 'bg-overlay-medium'}"
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.smartCrossfade
							? 'translate-x-5'
							: ''}"
					></span>
				</button>
			</div>

			<div class="mx-6 h-px bg-border"></div>

			<div class="flex items-center justify-between px-6 py-4 pb-5">
				<div>
					<p class="text-sm font-medium text-text-primary">{m.playback_same_album()}</p>
					<p class="text-xs text-text-secondary">{m.playback_same_album_desc()}</p>
				</div>
				<button
					aria-label={m.aria_toggle_same_album_crossfade()}
					onclick={() => updatePlayback({ sameAlbumCrossfade: !config.sameAlbumCrossfade })}
					class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.sameAlbumCrossfade
						? 'bg-accent'
						: 'bg-overlay-medium'}"
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.sameAlbumCrossfade
							? 'translate-x-5'
							: ''}"
					></span>
				</button>
			</div>
		{/if}
	</div>

	<!-- Card 2: Playback -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.playback_title()}</h2>

		<!-- Gapless Playback -->
		<div class="flex items-center justify-between px-6 py-4">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.playback_gapless()}</p>
				<p class="text-xs text-text-secondary">
					{m.playback_gapless_desc()}
				</p>
			</div>
			<button
				aria-label={m.aria_toggle_gapless()}
				onclick={() => updatePlayback({ gaplessPlayback: !config.gaplessPlayback })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.gaplessPlayback
					? 'bg-accent'
					: 'bg-overlay-medium'}"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.gaplessPlayback
						? 'translate-x-5'
						: ''}"
				></span>
			</button>
		</div>

		<div class="mx-6 h-px bg-border"></div>

		<!-- Volume Normalization -->
		<div class="flex items-center justify-between px-6 py-4">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.playback_normalize()}</p>
				<p class="text-xs text-text-secondary">
					{m.playback_normalize_desc()}
				</p>
			</div>
			<button
				aria-label={m.aria_toggle_normalization()}
				onclick={() => updatePlayback({ normalizeVolume: !config.normalizeVolume })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.normalizeVolume
					? 'bg-accent'
					: 'bg-overlay-medium'}"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.normalizeVolume
						? 'translate-x-5'
						: ''}"
				></span>
			</button>
		</div>

		<div class="mx-6 h-px bg-border"></div>

		<!-- Visualizer -->
		<div class="flex items-center justify-between px-6 py-4 pb-5">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.playback_visualizer()}</p>
				<p class="text-xs text-text-secondary">{m.playback_visualizer_desc()}</p>
			</div>
			<button
				aria-label={m.aria_toggle_visualizer()}
				onclick={() => updatePlayback({ visualizerEnabled: !config.visualizerEnabled })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.visualizerEnabled
					? 'bg-accent'
					: 'bg-overlay-medium'}"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.visualizerEnabled
						? 'translate-x-5'
						: ''}"
				></span>
			</button>
		</div>
	</div>
</div>
