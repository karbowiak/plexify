<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import type { Artist } from '$lib/backends/types';
	import { getBackend } from '$lib/stores/backendStore.svelte';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';

	let artists = $state<Artist[]>([]);
	let loading = $state(true);

	async function playArtist(artist: Artist) {
		const backend = getBackend();
		if (!backend?.getArtistTopTracks) return;
		const tracks = await backend.getArtistTopTracks(artist.id);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}

	$effect(() => {
		const backend = getBackend();
		if (!backend?.getLikedArtists) {
			loading = false;
			return;
		}

		loading = true;
		backend.getLikedArtists().then(
			(data) => {
				artists = data;
				loading = false;
			},
			() => {
				loading = false;
			}
		);
	});
</script>

<section>
	<h1 class="mb-6 text-2xl font-bold">Liked Artists</h1>

	{#if loading}
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each Array(12) as _}
				<div class="animate-pulse rounded-md bg-bg-elevated p-2">
					<div class="aspect-square w-full rounded-full bg-bg-highlight"></div>
					<div class="mt-2 space-y-2">
						<div class="h-3 w-3/4 rounded bg-bg-highlight"></div>
						<div class="h-2.5 w-1/2 rounded bg-bg-highlight"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each artists as artist}
				<a href="/artist/{artist.id}" class="contents">
					<Card
						title={artist.title}
						subtitle={artist.genres[0] ?? ''}
						imageUrl={artist.thumb ?? undefined}
						rounded
						compact
						onplay={() => playArtist(artist)}
					/>
				</a>
			{/each}
		</div>
	{/if}
</section>
