<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import { formatDuration } from '$lib/utils/format';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	function playSingleTrack(index: number) {
		playTracksNow(data.tracks, index);
		playCurrentItem();
	}
</script>

<section>
	<PageHeader
		title={m.liked_songs_title()}
		type={m.playlist_type()}
		subtitle={m.liked_songs_subtitle()}
		meta={m.playlist_songs_count({ count: data.tracks.length })}
		gradient="from-purple-900/30 via-bg-surface to-bg-surface"
	/>

	<div class="mt-6">
		{#each data.tracks as track, i}
			<TrackRow
				number={i + 1}
				title={track.title}
				artist={track.artistName}
				artistId={track.artistId}
				album={track.albumName || undefined}
				albumId={track.albumId || undefined}
				duration={formatDuration(track.duration)}
				onclick={() => playSingleTrack(i)}
			/>
		{/each}
	</div>
</section>
