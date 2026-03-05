<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import type { RadioCountry } from '$lib/backends/models/radioStation';
	import { countryFlag } from '$lib/plugins/radio-browser/serverTypes';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	let selectedCountry = $derived(
		data.selectedId ? data.countries.find((c) => c.name === data.selectedId) ?? null : null
	);

	function selectCountry(country: RadioCountry) {
		goto(`/radio/country?id=${encodeURIComponent(country.name)}`, { replaceState: false });
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

{#if selectedCountry}
	<div class="mb-4">
		<button
			type="button"
			onclick={() => goto('/radio/country')}
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<ArrowLeft size={14} />
			{m.radio_back_countries()}
		</button>
		<h2 class="mt-2 text-lg font-semibold text-text-primary">
			{countryFlag(selectedCountry.code)}
			{selectedCountry.name}
		</h2>
	</div>
	<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
		{#each data.stations as station (station.uuid)}
			<StationCard {station} variant="card" />
		{/each}
	</div>
{:else}
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
		{#each data.countries as country}
			<button
				type="button"
				onclick={() => selectCountry(country)}
				class="flex items-center gap-3 rounded-lg bg-bg-elevated px-4 py-3 text-left transition-colors hover:bg-bg-hover"
			>
				<span class="text-2xl">{countryFlag(country.code)}</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-text-primary">{country.name}</p>
					<p class="text-xs text-text-muted">
						{m.radio_stations_count({ count: country.station_count.toLocaleString() })}
					</p>
				</div>
			</button>
		{/each}
	</div>
{/if}
