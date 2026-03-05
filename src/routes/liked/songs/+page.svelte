<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import TrackRow from '$lib/components/ui/TrackRow.svelte';
	import type { Track } from '$lib/backends/types';
	import { getBackend } from '$lib/stores/backendStore.svelte';
	import { formatDuration } from '$lib/utils/format';
	import { playTracksNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';

	let tracks = $state<Track[]>([]);
	let loading = $state(true);

	function playSingleTrack(track: Track, index: number) {
		playTracksNow(tracks, index);
		playCurrentItem();
	}

	$effect(() => {
		const backend = getBackend();
		if (!backend?.getLikedTracks) {
			loading = false;
			return;
		}

		loading = true;
		backend.getLikedTracks().then(
			(data) => {
				tracks = data;
				loading = false;
			},
			() => {
				loading = false;
			}
		);
	});
</script>

<section>
	<PageHeader
		title="Liked Songs"
		type="Playlist"
		subtitle="Your favorite tracks"
		meta="{tracks.length} songs"
		gradient="from-purple-900/30 via-bg-surface to-bg-surface"
	/>

	<div class="mt-6">
		{#if loading}
			<div class="space-y-1">
				{#each Array(10) as _}
					<div class="flex h-10 animate-pulse items-center gap-3 rounded px-3">
						<div class="h-3 w-6 rounded bg-bg-highlight"></div>
						<div class="h-3 w-48 rounded bg-bg-highlight"></div>
						<div class="h-3 w-32 rounded bg-bg-highlight"></div>
						<div class="ml-auto h-3 w-10 rounded bg-bg-highlight"></div>
					</div>
				{/each}
			</div>
		{:else}
			{#each tracks as track, i}
				<TrackRow
					number={i + 1}
					title={track.title}
					artist={track.artistName}
					artistId={track.artistId}
					album={track.albumName || undefined}
					albumId={track.albumId || undefined}
					duration={formatDuration(track.duration)}
					onclick={() => playSingleTrack(track, i)}
				/>
			{/each}
		{/if}
	</div>
</section>
