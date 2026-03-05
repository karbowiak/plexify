<script lang="ts">
	import { formatDuration, formatNumber } from '$lib/utils/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import { Play, Shuffle } from 'lucide-svelte';
	import { playTracksNow, shuffleQueue } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	function playAll() {
		if (data.tracks.length === 0) return;
		playTracksNow(data.tracks, 0);
		playCurrentItem();
	}

	function shuffleAll() {
		if (data.tracks.length === 0) return;
		playTracksNow(data.tracks, 0);
		shuffleQueue();
		playCurrentItem();
	}

	function playFromIndex(i: number) {
		playTracksNow(data.tracks, i);
		playCurrentItem();
	}
</script>

<section>
	<PageHeader
		title={data.album.title}
		type={m.album_type_label()}
		subtitle={data.album.artistName}
		subtitleHref="/artist/{data.album.artistId}"
		meta="{data.album.year ?? m.album_unknown_year()} · {m.album_tracks_count({ count: data.album.trackCount })}{data.album.extra.fans && typeof data.album.extra.fans === 'number' && data.album.extra.fans > 0 ? ` · ${m.album_fans_count({ count: formatNumber(data.album.extra.fans) })}` : ''}"
		imageUrl={data.album.thumb ?? undefined}
	/>

	<!-- Action buttons -->
	<div class="mt-6 mb-6 flex items-center gap-4">
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

	<!-- Track listing -->
	<div>
		{#each data.tracks as track, i}
			<TrackRow
				number={track.trackNumber ?? i + 1}
				title={track.title}
				artist={track.artistName}
				artistId={track.artistId}
				duration={formatDuration(track.duration)}
				onclick={() => playFromIndex(i)}
			/>
		{/each}
	</div>
</section>
