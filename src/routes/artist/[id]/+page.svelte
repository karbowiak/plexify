<script lang="ts">
	import { resolveEntityBackend } from '$lib/stores/backendStore.svelte';
	import { formatDuration, formatNumber } from '$lib/utils/format';
	import Card from '$lib/components/ui/Card.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import { Play, Shuffle } from 'lucide-svelte';
	import { playTracksNow, shuffleQueue } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	function playAll() {
		if (data.topTracks.length === 0) return;
		playTracksNow(data.topTracks, 0);
		playCurrentItem();
	}

	function shuffleAll() {
		if (data.topTracks.length === 0) return;
		playTracksNow(data.topTracks, 0);
		shuffleQueue();
		playCurrentItem();
	}

	function playFromIndex(i: number) {
		playTracksNow(data.topTracks, i);
		playCurrentItem();
	}

	async function playAlbum(albumId: string) {
		const b = resolveEntityBackend(albumId);
		if (!b?.getAlbumTracks) return;
		const albumTracks = await b.getAlbumTracks(albumId);
		if (albumTracks.length === 0) return;
		playTracksNow(albumTracks, 0);
		playCurrentItem();
	}

	async function playArtist(artistId: string) {
		const b = resolveEntityBackend(artistId);
		if (!b?.getArtistTopTracks) return;
		const tracks = await b.getArtistTopTracks(artistId);
		if (tracks.length === 0) return;
		playTracksNow(tracks, 0);
		playCurrentItem();
	}
</script>

<section>
	<!-- Hero -->
	<div
		class="flex items-end gap-6 bg-gradient-to-b from-bg-hover/50 via-bg-surface to-bg-surface -mx-6 -mt-6 px-6 pt-20 pb-6"
	>
		<CachedImage
			src={data.artist.thumb}
			alt={data.artist.title}
			class="h-48 w-48 shrink-0 rounded-full object-cover shadow-xl"
		>
			{#snippet fallback()}
				<div
					class="flex h-48 w-48 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bg-highlight via-bg-elevated to-bg-highlight shadow-xl"
				>
					<span class="text-6xl text-text-muted">&#9835;</span>
				</div>
			{/snippet}
		</CachedImage>
		<div class="min-w-0">
			<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
				{m.artist_type_label()}
			</p>
			<h1 class="mb-2 text-5xl font-extrabold leading-tight">{data.artist.title}</h1>
			{#if data.artist.genres.length > 0}
				<p class="text-sm text-text-secondary">{data.artist.genres.join(' · ')}</p>
			{/if}
			{#if data.artist.extra.fanCount && typeof data.artist.extra.fanCount === 'number' && data.artist.extra.fanCount > 0}
				<p class="mt-1 text-xs text-text-muted">{m.artist_fans({ count: formatNumber(data.artist.extra.fanCount) })}</p>
			{/if}
		</div>
	</div>

	<!-- Action buttons -->
	<div class="mt-6 mb-8 flex items-center gap-4">
		<button
			type="button"
			onclick={playAll}
			class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-bg-base shadow-lg shadow-glow-accent transition-transform hover:scale-105"
		>
			<Play size={20} fill="currentColor" class="ml-0.5" />
		</button>
		<button
			type="button"
			onclick={shuffleAll}
			class="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:text-text-primary hover:border-text-primary"
		>
			<Shuffle size={18} />
		</button>
	</div>

	<!-- Popular Tracks -->
	{#if data.topTracks.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 text-xl font-bold">{m.artist_popular()}</h2>
			{#each data.topTracks as track, i}
				<TrackRow
					number={i + 1}
					title={track.title}
					artist={track.artistName}
					artistId={track.artistId}
					album={track.albumName}
					albumId={track.albumId}
					duration={formatDuration(track.duration)}
					onclick={() => playFromIndex(i)}
				/>
			{/each}
		</section>
	{/if}

	<!-- Discography -->
	{#if data.albums.length > 0}
		<HorizontalScroller title={m.artist_discography()}>
			{#each data.albums as alb}
				<div class="shrink-0" style:width="var(--scroller-item-width)">
					<a href="/album/{alb.id}" class="contents">
						<Card
							title={alb.title}
							subtitle="{alb.year ?? ''} · {m.artist_tracks_count({ count: alb.trackCount })}"
							imageUrl={alb.thumb ?? undefined}
							compact
							onplay={() => playAlbum(alb.id)}
						/>
					</a>
				</div>
			{/each}
		</HorizontalScroller>
	{/if}

	<!-- Fans Also Like -->
	{#if data.related.length > 0}
		<HorizontalScroller title={m.artist_fans_also_like()}>
			{#each data.related as similar}
				<div class="shrink-0" style:width="var(--scroller-item-width)">
					<a href="/artist/{similar.id}" class="contents">
						<Card
							title={similar.title}
							subtitle={similar.genres[0] ?? ''}
							imageUrl={similar.thumb ?? undefined}
							rounded
							compact
							onplay={() => playArtist(similar.id)}
						/>
					</a>
				</div>
			{/each}
		</HorizontalScroller>
	{/if}
</section>
