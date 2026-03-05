<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Globe, Heart, Clock, Map, Tag, Star } from 'lucide-svelte';
	import { Capability } from '$lib/backends/types';
	import { hasCapability } from '$lib/stores/backendStore.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';

	let { children }: { children: Snippet } = $props();

	type Tab = 'featured' | 'favorites' | 'recent' | 'country' | 'genre';

	const tabs: { id: Tab; label: () => string; icon: typeof Globe; path: string }[] = [
		{ id: 'featured', label: () => m.nav_featured(), icon: Globe, path: '/radio' },
		{ id: 'favorites', label: () => m.nav_favorites(), icon: Heart, path: '/radio/favorites' },
		{ id: 'recent', label: () => m.nav_recent(), icon: Clock, path: '/radio/recent' },
		{ id: 'country', label: () => m.nav_by_country(), icon: Map, path: '/radio/country' },
		{ id: 'genre', label: () => m.nav_by_genre(), icon: Tag, path: '/radio/genre' }
	];

	function isTabActive(tab: typeof tabs[number]): boolean {
		if (tab.id === 'featured') return page.url.pathname === '/radio';
		return page.url.pathname.startsWith(tab.path);
	}

	let radioAvailable = $derived(hasCapability(Capability.InternetRadio));
</script>

{#if !radioAvailable}
	<section class="flex flex-col items-center justify-center py-24 text-text-muted">
		<Globe size={64} class="mb-6 opacity-20" />
		<h2 class="mb-2 text-lg font-semibold text-text-primary">{m.radio_unavailable()}</h2>
		<p class="mb-4 text-sm">{m.radio_unavailable_desc()}</p>
		<a href="/settings" class="rounded-full bg-accent px-5 py-2 text-sm font-medium text-bg-base transition-colors hover:bg-accent/90">
			{m.action_go_to_settings()}
		</a>
	</section>
{:else}
	<section class="min-w-0 overflow-x-hidden">
		<!-- Header -->
		<div class="relative mb-6 flex items-center gap-4">
			<div class="pointer-events-none absolute -top-6 -left-6 h-32 w-96 rounded-full bg-accent/[0.04] blur-3xl"></div>
			<div
				class="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-bg-highlight"
			>
				<Globe size={24} class="text-accent" />
			</div>
			<div class="relative">
				<h1 class="text-2xl font-bold text-text-primary">{m.radio_title()}</h1>
				<p class="text-sm text-text-secondary">{m.radio_subtitle()}</p>
			</div>
		</div>

		<!-- Tabs -->
		<div class="mb-5 flex gap-2">
			{#each tabs as tab}
				<button
					type="button"
					onclick={() => goto(tab.path)}
					class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors {isTabActive(tab)
						? 'bg-accent text-bg-base'
						: 'bg-bg-highlight text-text-secondary hover:text-text-primary'}"
				>
					<tab.icon size={14} />
					{tab.label()}
				</button>
			{/each}
		</div>

		<!-- Page content -->
		{@render children()}
	</section>
{/if}
