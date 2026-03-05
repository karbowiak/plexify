<script lang="ts">
	import { getGeneral, setGeneral } from '$lib/stores/configStore.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { locales, getLocale, setLocale } from '$lib/paraglide/runtime.js';

	let config = $derived(getGeneral());

	const languageNames: Record<string, string> = {
		en: 'English'
	};

	function onLanguageChange(e: Event) {
		const tag = (e.target as HTMLSelectElement).value;
		setLocale(tag as any);
		setGeneral({ language: tag });
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">{m.general_title()}</h1>

	<!-- Language -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<div class="px-6 py-5">
			<p class="mb-1 text-sm font-medium text-text-primary">{m.general_language()}</p>
			<select
				value={getLocale()}
				onchange={onLanguageChange}
				class="mt-2 h-9 w-full max-w-xs rounded-md border border-border bg-bg-highlight px-3 text-sm text-text-primary focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/40"
			>
				{#each locales as tag}
					<option value={tag}>{languageNames[tag] ?? tag}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Preferences Card -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.general_preferences()}</h2>

		<!-- Track Notifications -->
		<div class="flex items-center justify-between px-6 py-4">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.general_track_notifications()}</p>
				<p class="text-xs text-text-secondary">
					{m.general_track_notifications_desc()}
				</p>
			</div>
			<button
				aria-label={m.aria_toggle_notifications()}
				onclick={() => setGeneral({ trackNotifications: !config.trackNotifications })}
				class="relative h-6 w-11 shrink-0 rounded-full transition-colors {config.trackNotifications
					? 'bg-accent'
					: 'bg-overlay-medium'}"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform {config.trackNotifications
						? 'translate-x-5'
						: ''}"
				></span>
			</button>
		</div>

		<div class="mx-6 h-px bg-border"></div>

		<!-- Album Deduplication -->
		<div class="flex items-center justify-between px-6 py-4">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.general_album_dedup()}</p>
				<p class="text-xs text-text-secondary">
					{m.general_album_dedup_desc()}
				</p>
			</div>
			<button
				aria-label={m.aria_toggle_dedup()}
				class="relative h-6 w-11 shrink-0 rounded-full bg-accent transition-colors"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white transition-transform"
				></span>
			</button>
		</div>

		<div class="mx-6 h-px bg-border"></div>

		<!-- Debug Mode -->
		<div class="flex items-center justify-between px-6 py-4 pb-5">
			<div>
				<p class="text-sm font-medium text-text-primary">{m.general_debug_mode()}</p>
				<p class="text-xs text-text-secondary">
					{m.general_debug_mode_desc()}
				</p>
			</div>
			<button
				aria-label={m.aria_toggle_debug()}
				class="relative h-6 w-11 shrink-0 rounded-full bg-accent transition-colors"
			>
				<span
					class="absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white transition-transform"
				></span>
			</button>
		</div>
	</div>

	<!-- Downloads - Coming Soon -->
	<div class="rounded-xl border border-border/60 bg-bg-elevated/60 p-6 opacity-50">
		<div class="flex items-center gap-3">
			<h2 class="text-sm font-semibold text-text-primary">{m.general_downloads()}</h2>
			<span class="text-xs text-text-muted">{m.general_coming_soon()}</span>
		</div>
		<p class="mt-2 text-sm text-text-muted">
			{m.general_downloads_desc()}
		</p>
	</div>

	<!-- AI - Coming Soon -->
	<div class="rounded-xl border border-border/60 bg-bg-elevated/60 p-6 opacity-50">
		<div class="flex items-center gap-3">
			<h2 class="text-sm font-semibold text-text-primary">{m.general_ai()}</h2>
			<span class="text-xs text-text-muted">{m.general_coming_soon()}</span>
		</div>
		<p class="mt-2 text-sm text-text-muted">
			{m.general_ai_desc()}
		</p>
	</div>
</div>
