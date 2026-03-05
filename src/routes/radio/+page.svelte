<script lang="ts">
	import type { RadioStation } from '$lib/radio/types';
	import { Capability } from '$lib/backends/types';
	import { getFirstBackendWithCapability } from '$lib/stores/backendStore.svelte';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';

	let topVoted = $state<RadioStation[]>([]);
	let topClicked = $state<RadioStation[]>([]);
	let trending = $state<RadioStation[]>([]);
	let featuredLoading = $state(true);

	function getRadioBackend() {
		return getFirstBackendWithCapability(Capability.InternetRadio);
	}

	async function loadFeatured() {
		featuredLoading = true;
		try {
			const rb = getRadioBackend();
			if (!rb?.getTopRadioStations) return;
			const [voted, clicked, trend] = await Promise.all([
				rb.getTopRadioStations('topvote', 15),
				rb.getTopRadioStations('topclick', 15),
				rb.getTopRadioStations('lastchange', 15)
			]);
			topVoted = voted;
			topClicked = clicked;
			trending = trend;
		} catch {
			// silent
		}
		featuredLoading = false;
	}

	loadFeatured();
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

<HorizontalScroller title="Top Voted" loading={featuredLoading}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each topVoted as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
<HorizontalScroller title="Most Popular" loading={featuredLoading}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each topClicked as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
<HorizontalScroller title="Recently Changed" loading={featuredLoading}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each trending as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
