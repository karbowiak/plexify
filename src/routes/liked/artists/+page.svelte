<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import type { Artist } from '$lib/backends/types';
	import { getBackend } from '$lib/stores/backendStore.svelte';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	async function playArtist(artist: Artist) {
		const backend = getBackend();
		if (!backend?.getArtistTopTracks) return;
		const tracks = await backend.getArtistTopTracks(artist.id);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}
</script>

<section>
	<h1 class="mb-6 text-2xl font-bold">{m.liked_artists_title()}</h1>

	<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
		{#each data.artists as artist}
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
</section>
