<script lang="ts">
	import {
		ArrowLeft,
		Podcast as PodcastIcon,
		Plus,
		Check,
		ChevronDown,
		ChevronUp
	} from 'lucide-svelte';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import { goto } from '$app/navigation';
	import type { PodcastEpisode } from '$lib/backends/models/podcast';
	import EpisodeRow from '$lib/components/podcast/EpisodeRow.svelte';
	import {
		subscribe,
		unsubscribe,
		isSubscribed,
		getEpisodeProgress,
		isCompleted
	} from '$lib/stores/podcastStore.svelte';
	import { playPodcastNow, getCurrentItem, getActiveMediaType } from '$lib/stores/unifiedQueue.svelte';
	import { getState, playCurrentItem, stopPlayback } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	let descExpanded = $state(false);

	let subscribed = $derived(data.feedUrl ? isSubscribed(data.feedUrl) : false);
	let currentItem = $derived(getCurrentItem());
	let mediaType = $derived(getActiveMediaType());
	let playState = $derived(getState());

	function toggleSubscribe() {
		if (!data.detail || !data.feedUrl) return;
		if (subscribed) {
			unsubscribe(data.feedUrl);
		} else {
			subscribe({
				feedUrl: data.feedUrl,
				podcastId: 0,
				title: data.detail.title,
				author: data.detail.author,
				artworkUrl: data.detail.artwork_url,
				addedAt: Date.now()
			});
		}
	}

	function isEpisodePlaying(episode: PodcastEpisode): boolean {
		return mediaType === 'podcast' && currentItem?.type === 'podcast' && currentItem.data.guid === episode.guid && playState === 'playing';
	}

	function handlePlay(episode: PodcastEpisode) {
		if (!data.detail || !data.feedUrl) return;
		if (isEpisodePlaying(episode)) {
			stopPlayback();
		} else {
			playPodcastNow(episode, data.feedUrl, data.detail.title, data.detail.artwork_url, data.detail.episodes);
			playCurrentItem();
		}
	}

	function episodeProgress(episode: PodcastEpisode): number {
		if (!data.feedUrl || !episode.duration_secs) return 0;
		const secs = getEpisodeProgress(data.feedUrl, episode.guid);
		return secs / episode.duration_secs;
	}

	function episodeCompleted(episode: PodcastEpisode): boolean {
		if (!data.feedUrl) return false;
		return isCompleted(data.feedUrl, episode.guid);
	}
</script>

<section class="min-w-0 overflow-x-hidden">
	<!-- Back button -->
	<button
		type="button"
		onclick={() => goto('/podcasts')}
		class="mb-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
	>
		<ArrowLeft size={14} />
		{m.podcasts_back()}
	</button>

	{#if data.detail}
		<!-- Hero -->
		<div class="relative mb-8">
			<!-- Blur background -->
			{#if data.detail.artwork_url}
				<div class="absolute inset-0 -top-16 -right-8 -left-8 overflow-hidden">
					<CachedImage
						src={data.detail.artwork_url}
						alt=""
						class="h-full w-full scale-110 object-cover opacity-15 blur-3xl"
					/>
				</div>
			{/if}

			<div class="relative flex gap-6">
				<!-- Artwork -->
				<div class="h-56 w-56 shrink-0 overflow-hidden rounded-lg shadow-lg">
					{#if data.detail.artwork_url}
						<CachedImage src={data.detail.artwork_url} alt="" class="h-full w-full object-cover" />
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-bg-highlight"
						>
							<PodcastIcon size={64} class="text-text-muted" />
						</div>
					{/if}
				</div>

				<!-- Info -->
				<div class="flex min-w-0 flex-1 flex-col justify-center">
					<p class="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
						{m.search_type_podcast()}
					</p>
					<h1 class="mb-1 text-2xl font-bold text-text-primary">{data.detail.title}</h1>
					<p class="mb-3 text-sm text-text-secondary">{data.detail.author}</p>

					<!-- Description -->
					{#if data.detail.description}
						<div class="mb-3">
							<p
								class="text-xs leading-relaxed text-text-secondary {descExpanded
									? ''
									: 'line-clamp-3'}"
							>
								{data.detail.description}
							</p>
							{#if data.detail.description.length > 200}
								<button
									type="button"
									onclick={() => (descExpanded = !descExpanded)}
									class="mt-1 flex items-center gap-0.5 text-xs text-accent hover:underline"
								>
									{descExpanded ? m.action_show_less() : m.action_show_more()}
									{#if descExpanded}
										<ChevronUp size={12} />
									{:else}
										<ChevronDown size={12} />
									{/if}
								</button>
							{/if}
						</div>
					{/if}

					<!-- Category tags -->
					{#if data.detail.categories.length > 0}
						<div class="mb-3 flex flex-wrap gap-1.5">
							{#each data.detail.categories as cat}
								<span
									class="rounded-full bg-bg-highlight px-2 py-0.5 text-[10px] text-text-muted"
								>
									{cat}
								</span>
							{/each}
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={toggleSubscribe}
							class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors {subscribed
								? 'bg-accent/20 text-accent hover:bg-accent/30'
								: 'bg-accent text-bg-base hover:bg-accent-hover'}"
						>
							{#if subscribed}
								<Check size={16} />
								{m.action_subscribed()}
							{:else}
								<Plus size={16} />
								{m.action_subscribe()}
							{/if}
						</button>
						<span class="text-xs text-text-muted">
							{m.podcasts_episodes_count({ count: data.detail.episodes.length })}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Episode list -->
		<div class="mb-2">
			<h2 class="text-sm font-semibold text-text-primary">{m.podcasts_episodes()}</h2>
		</div>
		<div class="space-y-0.5">
			{#each data.detail.episodes as episode (episode.guid)}
				<EpisodeRow
					{episode}
					podcastArtwork={data.detail.artwork_url}
					isPlaying={isEpisodePlaying(episode)}
					progress={episodeProgress(episode)}
					isCompleted={episodeCompleted(episode)}
					onplay={() => handlePlay(episode)}
				/>
			{/each}
		</div>
	{/if}
</section>
