<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import { Search } from 'lucide-svelte';
	import { formatDuration } from '$lib/utils/format';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<section>
	{#if !data.query}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<Search size={48} strokeWidth={1} />
			<p class="text-lg">{m.search_prompt()}</p>
		</div>
	{:else}
		<h1 class="mb-6 text-2xl font-bold">{m.search_results_for({ query: data.query })}</h1>

		{#if data.artists.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 text-xl font-bold">{m.search_artists()}</h2>
				<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
					{#each data.artists as artist (artist.id)}
						<a href="/artist/{artist.id}" class="contents">
							<Card title={artist.title} subtitle={artist.genres.join(', ')} imageUrl={artist.thumb ?? undefined} rounded compact />
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.albums.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 text-xl font-bold">{m.search_albums()}</h2>
				<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--card-scale, 1)), 1fr))">
					{#each data.albums as album (album.id)}
						<a href="/album/{album.id}" class="contents">
							<Card title={album.title} subtitle="{album.artistName} · {album.year ?? ''}" imageUrl={album.thumb ?? undefined} compact />
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.tracks.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 text-xl font-bold">{m.search_songs()}</h2>
				{#each data.tracks as track, i (track.id)}
					<TrackRow
						number={i + 1}
						title={track.title}
						artist={track.artistName}
						artistId={track.artistId}
						album={track.albumName}
						albumId={track.albumId}
						duration={formatDuration(track.duration)}
					/>
				{/each}
			</section>
		{/if}

		{#if data.artists.length === 0 && data.albums.length === 0 && data.tracks.length === 0}
			<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
				<Search size={48} strokeWidth={1} />
				<p class="text-lg">{m.search_no_results({ query: data.query })}</p>
			</div>
		{/if}
	{/if}
</section>
