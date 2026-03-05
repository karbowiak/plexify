<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import { Capability } from '$lib/backends/types';
	import type { Track, Album, Artist } from '$lib/backends/types';
	import { getBackend, hasCapability } from '$lib/stores/backendStore.svelte';
	import { formatDuration } from '$lib/utils/format';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';

	let likedArtists = $state<Artist[]>([]);
	let likedAlbums = $state<Album[]>([]);
	let likedTracks = $state<Track[]>([]);
	let loading = $state(true);

	function playSingleTrack(track: Track) {
		playTracksNow([track], 0);
		playCurrentItem();
	}

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

	$effect(() => {
		const backend = getBackend();
		if (!backend) {
			loading = false;
			return;
		}

		loading = true;

		const promises: Promise<void>[] = [];

		if (backend.getLikedArtists && backend.supports(Capability.Artists)) {
			promises.push(
				backend.getLikedArtists(20).then((data) => {
					likedArtists = data;
				})
			);
		}

		if (backend.getLikedAlbums && backend.supports(Capability.Albums)) {
			promises.push(
				backend.getLikedAlbums(20).then((data) => {
					likedAlbums = data;
				})
			);
		}

		if (backend.getLikedTracks && backend.supports(Capability.Tracks)) {
			promises.push(
				backend.getLikedTracks(10).then((data) => {
					likedTracks = data;
				})
			);
		}

		Promise.all(promises).finally(() => {
			loading = false;
		});
	});

	const showArtists = $derived(hasCapability(Capability.Artists) && (loading || likedArtists.length > 0));
	const showAlbums = $derived(hasCapability(Capability.Albums) && (loading || likedAlbums.length > 0));
	const showTracks = $derived(hasCapability(Capability.Tracks) && (loading || likedTracks.length > 0));
</script>

<section>
	<h1 class="mb-6 text-2xl font-bold">Your Library</h1>

	{#if !showArtists && !showAlbums && !showTracks}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<p class="text-lg">No library content available</p>
			<a href="/settings/backends" class="text-sm text-accent hover:underline"
				>Connect a backend to get started</a
			>
		</div>
	{:else}
		{#if showArtists}
			<HorizontalScroller title="Liked Artists" {loading}>
				{#snippet action()}
					<a href="/liked/artists" class="text-sm text-text-secondary hover:text-text-primary">See all</a>
				{/snippet}
				{#each likedArtists as artist}
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
			<HorizontalScroller title="Liked Albums" {loading}>
				{#snippet action()}
					<a href="/liked/albums" class="text-sm text-text-secondary hover:text-text-primary">See all</a>
				{/snippet}
				{#each likedAlbums as album}
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
					<h2 class="text-lg font-semibold text-text-primary">Liked Songs</h2>
					<a href="/liked/songs" class="text-sm text-text-secondary hover:text-text-primary">See all</a>
				</div>
				{#if loading}
					<div class="space-y-1">
						{#each Array(5) as _}
							<div class="flex h-10 animate-pulse items-center gap-3 rounded px-3">
								<div class="h-3 w-6 rounded bg-bg-highlight"></div>
								<div class="h-3 w-48 rounded bg-bg-highlight"></div>
								<div class="h-3 w-32 rounded bg-bg-highlight"></div>
								<div class="ml-auto h-3 w-10 rounded bg-bg-highlight"></div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-0.5">
						{#each likedTracks as track, i}
							<TrackRow
								number={i + 1}
								title={track.title}
								artist={track.artistName}
								artistId={track.artistId}
								album={track.albumName || undefined}
								albumId={track.albumId || undefined}
								duration={formatDuration(track.duration)}
								onclick={() => playSingleTrack(track)}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</section>
