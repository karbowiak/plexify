<script lang="ts">
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
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

<HorizontalScroller title={m.radio_top_voted()}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each data.topVoted as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
<HorizontalScroller title={m.radio_most_popular()}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each data.topClicked as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
<HorizontalScroller title={m.radio_recently_changed()}>
	{#snippet skeleton()}
		{@render cardSkeleton()}
	{/snippet}
	{#each data.trending as station (station.uuid)}
		<div class="shrink-0" style:width="var(--scroller-item-width)">
			<StationCard {station} variant="card" />
		</div>
	{/each}
</HorizontalScroller>
