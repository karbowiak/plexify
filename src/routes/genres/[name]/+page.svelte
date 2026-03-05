<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import { resolveEntityBackend } from '$lib/stores/backendStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	async function playArtist(artistId: string) {
		const b = resolveEntityBackend(artistId);
		if (!b?.getArtistTopTracks) return;
		const tracks = await b.getArtistTopTracks(artistId);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}

	async function playAlbum(albumId: string) {
		const b = resolveEntityBackend(albumId);
		if (!b?.getAlbumTracks) return;
		const tracks = await b.getAlbumTracks(albumId);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}
</script>

<section>
	<h1 class="mb-6 text-3xl font-extrabold">{data.name}</h1>

	{#if data.artists.length > 0}
		<h2 class="mb-4 text-xl font-bold">{m.genres_artists()}</h2>
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each data.artists as a}
				<a href="/artist/{a.id}" class="contents">
					<Card
						title={a.title}
						subtitle={a.genres[0] ?? ''}
						imageUrl={a.thumb ?? undefined}
						rounded
						compact
						onplay={() => playArtist(a.id)}
					/>
				</a>
			{/each}
		</div>
	{/if}

	{#if data.albums.length > 0}
		<h2 class="mb-4 text-xl font-bold">{m.genres_albums()}</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each data.albums as alb}
				<a href="/album/{alb.id}" class="contents">
					<Card
						title={alb.title}
						subtitle="{alb.year ?? ''} · {alb.artistName}"
						imageUrl={alb.thumb ?? undefined}
						compact
						onplay={() => playAlbum(alb.id)}
					/>
				</a>
			{/each}
		</div>
	{/if}

	{#if data.artists.length === 0 && data.albums.length === 0}
		<p class="py-12 text-center text-text-muted">{m.genres_no_items()}</p>
	{/if}
</section>
