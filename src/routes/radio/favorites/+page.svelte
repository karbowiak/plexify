<script lang="ts">
	import { Heart } from 'lucide-svelte';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { getFavorites } from '$lib/stores/radioStore.svelte';

	let favorites = $derived(getFavorites());
</script>

{#if favorites.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-text-muted">
		<Heart size={48} class="mb-4 opacity-30" />
		<p class="text-sm">No favorite stations yet</p>
		<p class="text-xs">Click the heart icon on any station to save it here</p>
	</div>
{:else}
	<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
		{#each favorites as station (station.uuid)}
			<StationCard {station} variant="card" />
		{/each}
	</div>
{/if}
