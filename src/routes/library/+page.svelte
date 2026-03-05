<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import type { Album, Artist } from '$lib/backends/types';
	import { getBackend } from '$lib/stores/backendStore.svelte';
	import { formatDuration } from '$lib/utils/format';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	async function playAlbum(album: Album) {
		const backend = getBackend();
		if (!backend?.getAlbumTracks) return;
		const tracks = await backend.getAlbumTracks(album.id);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}

	async function playArtist(artist: Artist) {
		const backend = getBackend();
		if (!backend?.getArtistTopTracks) return;
		const tracks = await backend.getArtistTopTracks(artist.id);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}

	const showArtists = $derived(data.hasArtists && data.likedArtists.length > 0);
	const showAlbums = $derived(data.hasAlbums && data.likedAlbums.length > 0);
	const showTracks = $derived(data.hasTracks && data.likedTracks.length > 0);
</script>

<section>
	<h1 class="mb-6 text-2xl font-bold">{m.library_title()}</h1>

	{#if !showArtists && !showAlbums && !showTracks}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<p class="text-lg">{m.library_empty()}</p>
			<a href="/settings/backends" class="text-sm text-accent hover:underline"
				>{m.library_connect()}</a
			>
		</div>
	{:else}
		{#if showArtists}
			<HorizontalScroller title={m.liked_artists_title()}>
				{#snippet action()}
					<a href="/liked/artists" class="text-sm text-text-secondary hover:text-text-primary">{m.action_see_all()}</a>
				{/snippet}
				{#each data.likedArtists as artist}
					<div class="shrink-0" style:width="var(--scroller-item-width)">
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
					</div>
				{/each}
			</HorizontalScroller>
		{/if}

		{#if showAlbums}
			<HorizontalScroller title={m.liked_albums_title()}>
				{#snippet action()}
					<a href="/liked/albums" class="text-sm text-text-secondary hover:text-text-primary">{m.action_see_all()}</a>
				{/snippet}
				{#each data.likedAlbums as album}
					<div class="shrink-0" style:width="var(--scroller-item-width)">
						<a href="/album/{album.id}" class="contents">
							<Card
								title={album.title}
								subtitle={album.artistName}
								imageUrl={album.thumb ?? undefined}
								compact
								onplay={() => playAlbum(album)}
							/>
						</a>
					</div>
				{/each}
			</HorizontalScroller>
		{/if}

		{#if showTracks}
			<div class="mb-8">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-text-primary">{m.liked_songs_title()}</h2>
					<a href="/liked/songs" class="text-sm text-text-secondary hover:text-text-primary">{m.action_see_all()}</a>
				</div>
				<div class="space-y-0.5">
					{#each data.likedTracks as track, i}
						<TrackRow
							number={i + 1}
							title={track.title}
							artist={track.artistName}
							artistId={track.artistId}
							album={track.albumName || undefined}
							albumId={track.albumId || undefined}
							duration={formatDuration(track.duration)}
							onclick={() => {
								playTracksNow(data.likedTracks, i);
								playCurrentItem();
							}}
						/>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>
