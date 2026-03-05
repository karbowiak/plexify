<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { X, Heart, Search } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import {
		closePresetBrowser,
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
		getPresetHistory
	} from '$lib/stores/visualizerStore.svelte';

	interface Props {
		presetKeys: string[];
	}

	let { presetKeys }: Props = $props();

	type Tab = 'all' | 'favorites' | 'history';
	let activeTab = $state<Tab>('all');
	let searchQuery = $state('');
	let listEl: HTMLDivElement | undefined = $state();

	let currentName = $derived(getCurrentPresetName());
	let favorites = $derived(getFavoritePresets());
	let history = $derived(getPresetHistory());
	let cycleEnabled = $derived(getAutoCycleEnabled());
	let cycleInterval = $derived(getAutoCycleIntervalSec());
	let cycleMode = $derived(getAutoCycleMode());

	let sourceList = $derived.by(() => {
		if (activeTab === 'favorites') return favorites.filter((n) => presetKeys.includes(n));
		if (activeTab === 'history') return history.filter((n) => presetKeys.includes(n));
		return presetKeys;
	});

	let filtered = $derived.by(() => {
		if (!searchQuery.trim()) return sourceList;
		const q = searchQuery.toLowerCase();
		return sourceList.filter((k) => k.toLowerCase().includes(q));
	});

	// Auto-scroll active preset into view on open
	$effect(() => {
		if (!listEl || !currentName) return;
		requestAnimationFrame(() => {
			const active = listEl?.querySelector('[data-active="true"]');
			active?.scrollIntoView({ block: 'center', behavior: 'instant' });
		});
	});

	function selectPreset(name: string) {
		setCurrentPreset(name);
	}

	function onToggleFavorite(e: MouseEvent, name: string) {
		e.stopPropagation();
		toggleFavorite(name);
	}
</script>

<!-- Backdrop -->
<div
	class="absolute inset-0 z-20"
	role="button"
	tabindex="-1"
	onclick={closePresetBrowser}
	onkeydown={(e) => { if (e.key === 'Escape') closePresetBrowser(); }}
	transition:fly={{ x: 0, duration: 150, opacity: 0 }}
></div>

<!-- Panel -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute right-0 top-0 bottom-0 z-30 flex w-80 flex-col border-l border-white/10 bg-black/90 backdrop-blur-md"
	role="dialog"
	tabindex="-1"
	transition:fly={{ x: 320, duration: 200 }}
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => { if (e.key === 'Escape') closePresetBrowser(); }}
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
		<span class="text-sm font-semibold text-white">{m.visualizer_presets_title()}</span>
		<button
			type="button"
			class="text-white/40 transition-colors hover:text-white"
			onclick={closePresetBrowser}
			aria-label={m.aria_close_preset_browser()}
		>
			<X size={16} />
		</button>
	</div>

	<!-- Auto-cycle controls -->
	<div class="flex items-center gap-2 border-b border-white/10 px-4 py-2">
		<label class="flex items-center gap-1.5 text-xs text-white/60">
			<input
				type="checkbox"
				checked={cycleEnabled}
				onchange={() => setAutoCycleEnabled(!cycleEnabled)}
				class="accent-accent h-3.5 w-3.5"
			/>
			{m.visualizer_auto_cycle()}
		</label>
		<select
			class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70"
			value={cycleInterval}
			onchange={(e) => setAutoCycleIntervalSec(Number(e.currentTarget.value))}
		>
			{#each [15, 30, 45, 60, 90, 120] as sec}
				<option value={sec}>{sec}s</option>
			{/each}
		</select>
		<select
			class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70"
			value={cycleMode}
			onchange={(e) => setAutoCycleMode(e.currentTarget.value as 'random' | 'sequential')}
		>
			<option value="random">{m.visualizer_random()}</option>
			<option value="sequential">{m.visualizer_sequential()}</option>
		</select>
	</div>

	<!-- Search -->
	<div class="relative border-b border-white/10 px-4 py-2">
		<Search size={14} class="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" />
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			placeholder={m.visualizer_search_placeholder()}
			bind:value={searchQuery}
			autofocus
			class="w-full rounded bg-white/10 py-1.5 pl-7 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50"
		/>
	</div>

	<!-- Tabs -->
	<div class="flex border-b border-white/10">
		{#each [['all', m.visualizer_tab_all({ count: presetKeys.length })], ['favorites', m.visualizer_tab_favorites({ count: favorites.length })], ['history', m.visualizer_tab_history({ count: history.length })]] as [tab, label]}
			<button
				type="button"
				class="flex-1 py-2 text-center text-xs transition-colors {activeTab === tab
					? 'border-b-2 border-accent text-accent'
					: 'text-white/50 hover:text-white/70'}"
				onclick={() => (activeTab = tab as Tab)}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Preset list -->
	<div bind:this={listEl} class="flex-1 overflow-y-auto">
		{#each filtered as name (name)}
			<button
				type="button"
				class="group flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5 {currentName === name
					? 'bg-accent/15 text-accent'
					: 'text-white/70'}"
				data-active={currentName === name}
				onclick={() => selectPreset(name)}
			>
				<span
					role="switch"
					aria-checked={isFavorite(name)}
					tabindex="-1"
					class="shrink-0 transition-colors {isFavorite(name)
						? 'text-red-400'
						: 'text-white/20 opacity-0 group-hover:opacity-100'}"
					onclick={(e) => onToggleFavorite(e, name)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleFavorite(e as unknown as MouseEvent, name); } }}
					aria-label={isFavorite(name) ? m.aria_unfavorite() : m.aria_favorite()}
				>
					<Heart size={12} fill={isFavorite(name) ? 'currentColor' : 'none'} />
				</span>
				<span class="min-w-0 flex-1 truncate text-xs">{name}</span>
			</button>
		{/each}
		{#if filtered.length === 0}
			<div class="px-4 py-8 text-center text-xs text-white/30">
				{searchQuery ? m.visualizer_no_matching() : m.visualizer_no_presets()}
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t border-white/10 px-4 py-2 text-center text-[0.625rem] text-white/30">
		{m.visualizer_footer({ presetCount: filtered.length, favCount: favorites.length })}
	</div>
</div>
