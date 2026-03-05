<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import type { Album } from '$lib/backends/types';
	import { getBackend } from '$lib/stores/backendStore.svelte';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';

	let albums = $state<Album[]>([]);
	let loading = $state(true);

	async function playAlbum(album: Album) {
		const backend = getBackend();
		if (!backend?.getAlbumTracks) return;
		const tracks = await backend.getAlbumTracks(album.id);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}

	$effect(() => {
		const backend = getBackend();
		if (!backend?.getLikedAlbums) {
			loading = false;
			return;
		}

		loading = true;
		backend.getLikedAlbums().then(
			(data) => {
				albums = data;
				loading = false;
			},
			() => {
				loading = false;
			}
		);
	});
</script>

<section>
	<h1 class="mb-6 text-2xl font-bold">Liked Albums</h1>

	{#if loading}
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each Array(12) as _}
				<div class="animate-pulse rounded-md bg-bg-elevated p-2">
					<div class="aspect-square w-full rounded bg-bg-highlight"></div>
					<div class="mt-2 space-y-2">
						<div class="h-3 w-3/4 rounded bg-bg-highlight"></div>
						<div class="h-2.5 w-1/2 rounded bg-bg-highlight"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
			{#each albums as album}
				<a href="/album/{album.id}" class="contents">
					<Card
						title={album.title}
						subtitle={album.artistName}
						imageUrl={album.thumb ?? undefined}
						compact
						onplay={() => playAlbum(album)}
					/>
				</a>
			{/each}
		</div>
	{/if}
</section>
