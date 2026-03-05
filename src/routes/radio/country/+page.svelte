<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import type { RadioStation, RadioCountry } from '$lib/radio/types';
	import { countryFlag } from '$lib/radio/types';
	import { Capability } from '$lib/backends/types';
	import { getFirstBackendWithCapability } from '$lib/stores/backendStore.svelte';
	import StationCard from '$lib/components/radio/StationCard.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let countries = $state<RadioCountry[]>([]);
	let countriesLoaded = $state(false);
	let countriesLoading = $state(false);
	let selectedCountry = $state<RadioCountry | null>(null);
	let countryStations = $state<RadioStation[]>([]);
	let countryStationsLoading = $state(false);

	function getRadioBackend() {
		return getFirstBackendWithCapability(Capability.InternetRadio);
	}

	async function loadCountries() {
		if (countriesLoaded) return;
		countriesLoading = true;
		try {
			const rb = getRadioBackend();
			if (!rb?.getRadioCountries) return;
			countries = await rb.getRadioCountries();
			countriesLoaded = true;
		} catch {
			// silent
		}
		countriesLoading = false;
	}

	async function selectCountry(country: RadioCountry) {
		goto(`/radio/country?id=${encodeURIComponent(country.name)}`, { replaceState: false });
		selectedCountry = country;
		countryStationsLoading = true;
		try {
			const rb = getRadioBackend();
			countryStations = rb?.searchRadioStations
				? await rb.searchRadioStations({ country: country.name, limit: 30 })
				: [];
		} catch {
			countryStations = [];
		}
		countryStationsLoading = false;
	}

	// Sync state from URL (back/forward navigation)
	$effect(() => {
		const id = page.url.searchParams.get('id');
		loadCountries();

		if (id && (!selectedCountry || selectedCountry.name !== id)) {
			const found = countries.find((c) => c.name === id);
			if (found) {
				selectedCountry = found;
				countryStationsLoading = true;
				const rb = getRadioBackend();
				if (rb?.searchRadioStations) {
					rb.searchRadioStations({ country: found.name, limit: 30 })
						.then((s) => (countryStations = s))
						.catch(() => (countryStations = []))
						.finally(() => (countryStationsLoading = false));
				} else {
					countryStationsLoading = false;
				}
			}
		} else if (!id) {
			selectedCountry = null;
			countryStations = [];
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

{#if selectedCountry}
	<div class="mb-4">
		<button
			type="button"
			onclick={() => goto('/radio/country')}
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<ArrowLeft size={14} />
			Back to countries
		</button>
		<h2 class="mt-2 text-lg font-semibold text-text-primary">
			{countryFlag(selectedCountry.code)}
			{selectedCountry.name}
		</h2>
	</div>
	{#if countryStationsLoading}
		<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each Array(6) as _}
				{@render cardSkeleton()}
			{/each}
		</div>
	{:else}
		<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each countryStations as station (station.uuid)}
				<StationCard {station} variant="card" />
			{/each}
		</div>
	{/if}
{:else if countriesLoading}
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
		{#each Array(20) as _}
			<div class="h-14 animate-pulse rounded-lg bg-bg-elevated"></div>
		{/each}
	</div>
{:else}
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
		{#each countries as country}
			<button
				type="button"
				onclick={() => selectCountry(country)}
				class="flex items-center gap-3 rounded-lg bg-bg-elevated px-4 py-3 text-left transition-colors hover:bg-bg-hover"
			>
				<span class="text-2xl">{countryFlag(country.code)}</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-text-primary">{country.name}</p>
					<p class="text-xs text-text-muted">
						{country.station_count.toLocaleString()} stations
					</p>
				</div>
			</button>
		{/each}
	</div>
{/if}
