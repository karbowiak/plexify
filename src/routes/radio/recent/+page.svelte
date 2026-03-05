<script lang="ts">
	import { Clock, Trash2 } from 'lucide-svelte';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { getRecentStations, clearRecent } from '$lib/stores/radioStore.svelte';

	let recentStations = $derived(getRecentStations());
</script>

{#if recentStations.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-text-muted">
		<Clock size={48} class="mb-4 opacity-30" />
		<p class="text-sm">No recently played stations</p>
		<p class="text-xs">Stations you play will appear here</p>
	</div>
{:else}
	<div class="mb-3 flex justify-end">
		<button
			type="button"
			onclick={() => clearRecent()}
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<Trash2 size={12} />
			Clear history
		</button>
	</div>
	<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
		{#each recentStations as station (station.uuid)}
			<StationCard {station} variant="card" />
		{/each}
	</div>
{/if}
