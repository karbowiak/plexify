<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import { Capability } from '$lib/backends/types';
	import type { Hub, Track, Album, Artist } from '$lib/backends/types';
	import { getBackend, hasCapability } from '$lib/stores/backendStore.svelte';
	import { formatDuration } from '$lib/utils/format';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';

	let { data } = $props();

	let greetingText = $state('');
	onMount(() => {
		const h = new Date().getHours();
		if (h < 12) greetingText = m.home_good_morning();
		else if (h < 18) greetingText = m.home_good_afternoon();
		else greetingText = m.home_good_evening();
	});

	function isTrack(item: Track | Album | Artist): item is Track {
		return 'duration' in item && 'artistName' in item && !('trackCount' in item);
	}

	function isAlbum(item: Track | Album | Artist): item is Album {
		return 'trackCount' in item;
	}

	function isArtist(item: Track | Album | Artist): item is Artist {
		return !isTrack(item) && !isAlbum(item);
	}

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
</script>

<section>
	<div class="relative mb-6">
		<div
			class="pointer-events-none absolute -top-6 -left-6 h-32 w-96 rounded-full bg-accent/[0.04] blur-3xl"
		></div>
		<h1 class="relative text-3xl font-bold">{greetingText}</h1>
	</div>

	{#if !hasCapability(Capability.Hubs) && data.hubs.length === 0}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<p class="text-lg">{m.home_no_backend()}</p>
			<a href="/settings/backends" class="text-sm text-accent hover:underline"
				>{m.home_connect_backend()}</a
			>
		</div>
	{:else}
		{#each data.hubs as hub}
			{#if hub.layout === 'list'}
				{@const tracks = hub.items.filter(isTrack)}
				<div class="mb-8">
					<h2 class="mb-3 text-lg font-semibold text-text-primary">{hub.title}</h2>
					<div class="space-y-0.5">
						{#each tracks.slice(0, 10) as track, i}
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
				</div>
			{:else if hub.layout === 'scroller'}
				<HorizontalScroller title={hub.title}>
					{#each hub.items as item}
						{#if isTrack(item)}
							<div class="shrink-0" style:width="var(--scroller-item-width)">
								<a href="/album/{item.albumId}" class="contents">
									<Card
										title={item.title}
										subtitle={item.artistName}
										imageUrl={item.thumb ?? undefined}
										compact
										onplay={() => playSingleTrack(item)}
									/>
								</a>
							</div>
						{:else if isAlbum(item)}
							<div class="shrink-0" style:width="var(--scroller-item-width)">
								<a href="/album/{item.id}" class="contents">
									<Card
										title={item.title}
										subtitle={item.artistName}
										imageUrl={item.thumb ?? undefined}
										compact
										onplay={() => playAlbum(item)}
									/>
								</a>
							</div>
						{:else if isArtist(item)}
							<div class="shrink-0" style:width="var(--scroller-item-width)">
								<a href="/artist/{item.id}" class="contents">
									<Card
										title={item.title}
										subtitle={item.genres[0] ?? ''}
										imageUrl={item.thumb ?? undefined}
										rounded
										compact
										onplay={() => playArtist(item)}
									/>
								</a>
							</div>
						{/if}
					{/each}
				</HorizontalScroller>
			{:else if hub.layout === 'hero'}
				<div class="mb-8">
					<h2 class="mb-3 text-lg font-semibold text-text-primary">{hub.title}</h2>
					<div class="grid grid-cols-3 gap-4">
						{#each hub.items.slice(0, 3) as item}
							{@const href = isArtist(item) ? `/artist/${item.id}` : isAlbum(item) ? `/album/${item.id}` : isTrack(item) && item.albumId ? `/album/${item.albumId}` : '#'}
							{@const subtitle = isTrack(item) ? item.artistName : isAlbum(item) ? item.artistName : isArtist(item) ? (item.genres[0] ?? '') : ''}
							<a {href} class="group relative overflow-hidden rounded-lg bg-bg-elevated">
								<div class="aspect-[16/9] w-full overflow-hidden">
									{#if isTrack(item) && item.thumb}
										<img src={item.thumb} alt="" class="h-full w-full object-cover transition-transform group-hover:scale-105" />
									{:else if isAlbum(item) && item.thumb}
										<img src={item.thumb} alt="" class="h-full w-full object-cover transition-transform group-hover:scale-105" />
									{:else if isArtist(item) && item.thumb}
										<img src={item.thumb} alt="" class="h-full w-full object-cover transition-transform group-hover:scale-105" />
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight text-text-muted">{m.home_no_image()}</div>
									{/if}
								</div>
								<div class="p-3">
									<p class="truncate font-medium text-text-primary">{item.title}</p>
									<p class="truncate text-sm text-text-muted">{subtitle}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{:else if hub.layout === 'pills'}
				<div class="mb-8">
					<h2 class="mb-3 text-lg font-semibold text-text-primary">{hub.title}</h2>
					<div class="flex flex-wrap gap-2">
						{#each hub.items as item}
							<span class="rounded-full bg-bg-elevated px-3 py-1.5 text-sm text-text-primary hover:bg-bg-highlight transition-colors cursor-pointer">
								{item.title}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{/if}
</section>
