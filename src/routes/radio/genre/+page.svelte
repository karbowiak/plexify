<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import type { RadioTag } from '$lib/backends/models/radioStation';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	let selectedTag = $derived(
		data.selectedId ? data.tags.find((t) => t.name === data.selectedId) ?? null : null
	);

	function selectTag(tag: RadioTag) {
		goto(`/radio/genre?id=${encodeURIComponent(tag.name)}`, { replaceState: false });
	}
</script>

{#snippet cardSkeleton()}
	<div class="animate-pulse rounded-md bg-bg-elevated p-2">
		<div class="aspect-square w-full rounded bg-bg-highlight"></div>
		<div class="mt-2 space-y-1.5">
			<div class="h-3 w-3/4 rounded bg-bg-highlight"></div>
			<div class="h-2.5 w-1/2 rounded bg-bg-highlight"></div>
		</div>
	</div>
{/snippet}

{#if selectedTag}
	<div class="mb-4">
		<button
			type="button"
			onclick={() => goto('/radio/genre')}
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<ArrowLeft size={14} />
			{m.radio_back_genres()}
		</button>
		<h2 class="mt-2 text-lg font-semibold text-text-primary capitalize">
			{selectedTag.name}
		</h2>
	</div>
	<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
		{#each data.stations as station (station.uuid)}
			<StationCard {station} variant="card" />
		{/each}
	</div>
{:else}
	<div class="flex flex-wrap gap-2">
		{#each data.tags as tag}
			<button
				type="button"
				onclick={() => selectTag(tag)}
				class="rounded-full bg-bg-elevated px-3 py-1.5 text-sm transition-colors hover:bg-bg-hover"
			>
				<span class="capitalize text-text-primary">{tag.name}</span>
				<span class="ml-1 text-xs text-text-muted">
					{tag.station_count.toLocaleString()}
				</span>
			</button>
		{/each}
	</div>
{/if}
