<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import type { RadioStation, RadioTag } from '$lib/radio/types';
	import { Capability } from '$lib/backends/types';
	import { getFirstBackendWithCapability } from '$lib/stores/backendStore.svelte';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let tags = $state<RadioTag[]>([]);
	let tagsLoaded = $state(false);
	let tagsLoading = $state(false);
	let selectedTag = $state<RadioTag | null>(null);
	let tagStations = $state<RadioStation[]>([]);
	let tagStationsLoading = $state(false);

	function getRadioBackend() {
		return getFirstBackendWithCapability(Capability.InternetRadio);
	}

	async function loadTags() {
		if (tagsLoaded) return;
		tagsLoading = true;
		try {
			const rb = getRadioBackend();
			if (!rb?.getRadioTags) return;
			tags = await rb.getRadioTags(100);
			tagsLoaded = true;
		} catch {
			// silent
		}
		tagsLoading = false;
	}

	async function selectTag(tag: RadioTag) {
		goto(`/radio/genre?id=${encodeURIComponent(tag.name)}`, { replaceState: false });
		selectedTag = tag;
		tagStationsLoading = true;
		try {
			const rb = getRadioBackend();
			tagStations = rb?.searchRadioStations
				? await rb.searchRadioStations({ tag: tag.name, limit: 30 })
				: [];
		} catch {
			tagStations = [];
		}
		tagStationsLoading = false;
	}

	// Sync state from URL (back/forward navigation)
	$effect(() => {
		const id = page.url.searchParams.get('id');
		loadTags();

		if (id && (!selectedTag || selectedTag.name !== id)) {
			const found = tags.find((t) => t.name === id);
			if (found) {
				selectedTag = found;
				tagStationsLoading = true;
				const rb = getRadioBackend();
				if (rb?.searchRadioStations) {
					rb.searchRadioStations({ tag: found.name, limit: 30 })
						.then((s) => (tagStations = s))
						.catch(() => (tagStations = []))
						.finally(() => (tagStationsLoading = false));
				} else {
					tagStationsLoading = false;
				}
			}
		} else if (!id) {
			selectedTag = null;
			tagStations = [];
		}
	});
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
			Back to genres
		</button>
		<h2 class="mt-2 text-lg font-semibold text-text-primary capitalize">
			{selectedTag.name}
		</h2>
	</div>
	{#if tagStationsLoading}
		<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each Array(6) as _}
				{@render cardSkeleton()}
			{/each}
		</div>
	{:else}
		<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each tagStations as station (station.uuid)}
				<StationCard {station} variant="card" />
			{/each}
		</div>
	{/if}
{:else if tagsLoading}
	<div class="flex flex-wrap gap-2">
		{#each Array(30) as _}
			<div class="h-8 w-24 animate-pulse rounded-full bg-bg-elevated"></div>
		{/each}
	</div>
{:else}
	<div class="flex flex-wrap gap-2">
		{#each tags as tag}
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
