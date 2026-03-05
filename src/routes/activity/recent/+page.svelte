<script lang="ts">
	import {
		ArrowLeft,
		Radio,
		Podcast,
		Music,
		Play,
		Eye,
		EyeOff,
		Clock
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import BackendBadge from '$lib/components/ui/BackendBadge.svelte';
	import {
		getItems,
		isLoading,
		getShowHidden,
		getBackendFilter,
		loadEvents,
		setBackendFilter,
		toggleShowHidden,
		getBackendBreakdown,
		getRecentArtists,
		getRecentAlbums,
		type AppEvent,
		type BackendBreakdown
	} from '$lib/stores/eventStore.svelte';
	import { playTracksNow, playRadioNow, playPodcastNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { Track } from '$lib/backends/models/track';
	import type { RadioStation } from '$lib/backends/models/radioStation';
	import type { PodcastEpisode } from '$lib/backends/models/podcast';

	const PAGE_SIZE = 50;

	let breakdown = $state<BackendBreakdown[]>([]);
	let sentinel: HTMLDivElement | undefined = $state();
	let currentOffset = $state(0);
	let hasMore = $state(true);

	let allItems = $derived(getItems());
	let events = $derived(allItems.filter((e) => e.category === 'play'));
	let loading = $derived(isLoading());
	let showHidden = $derived(getShowHidden());
	let backendFilter = $derived(getBackendFilter());

	let recentArtists = $derived(getRecentArtists(12));
	let recentAlbums = $derived(getRecentAlbums(12));

	async function loadAll() {
		currentOffset = 0;
		hasMore = true;
		await Promise.all([
			loadEvents(PAGE_SIZE, 0, {
				category: 'play',
				backendId: backendFilter ?? undefined
			}),
			getBackendBreakdown().then((b) => (breakdown = b))
		]);
		hasMore = getItems().length >= PAGE_SIZE;
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		currentOffset += PAGE_SIZE;
		const results = await loadEvents(PAGE_SIZE, currentOffset, {
			category: 'play',
			backendId: backendFilter ?? undefined
		});
		hasMore = results.length >= PAGE_SIZE;
	}

	$effect(() => {
		void showHidden;
		void backendFilter;
		loadAll();
	});

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !loading && hasMore) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	function getDateGroup(date: Date): string {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 86400000);
		const weekStart = new Date(today.getTime() - today.getDay() * 86400000);
		const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400000);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const d = new Date(date);
		const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		if (entryDay.getTime() >= today.getTime()) return m.time_today();
		if (entryDay.getTime() >= yesterday.getTime()) return m.time_yesterday();
		if (entryDay.getTime() >= weekStart.getTime()) return m.time_this_week();
		if (entryDay.getTime() >= lastWeekStart.getTime()) return m.time_last_week();
		if (entryDay.getTime() >= monthStart.getTime()) return m.time_this_month();
		return d.toLocaleString('default', { month: 'long', year: 'numeric' });
	}

	function relativeTime(date: Date): string {
		const now = Date.now();
		const d = new Date(date).getTime();
		const diffMs = now - d;
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return m.time_just_now();
		if (diffMin < 60) return m.time_minutes_ago({ count: diffMin });
		const diffHours = Math.floor(diffMin / 60);
		if (diffHours < 24) return m.time_hours_ago({ count: diffHours });
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return m.time_days_ago({ count: diffDays });
		return new Date(date).toLocaleDateString();
	}

	function playTypeIcon(type: string) {
		switch (type) {
			case 'track_play': return Music;
			case 'radio_play': return Radio;
			case 'podcast_play': return Podcast;
			default: return Music;
		}
	}

	function getEventHref(event: AppEvent): string | null {
		const p = event.payload;
		switch (event.type) {
			case 'track_play': return p.artistId ? `/artist/${p.artistId}` : null;
			case 'podcast_play': return p.feedUrl ? `/podcasts/${btoa(p.feedUrl as string)}` : null;
			case 'radio_play': return '/radio';
			default: return null;
		}
	}

	function canPlayEvent(event: AppEvent): boolean {
		const p = event.payload;
		switch (event.type) {
			case 'track_play': return true;
			case 'radio_play': return !!p.streamUrl;
			case 'podcast_play': return !!p.audioUrl && !!p.feedUrl;
			default: return false;
		}
	}

	async function playEvent(event: AppEvent) {
		const p = event.payload;
		switch (event.type) {
			case 'track_play': {
				const track: Track = {
					id: p.entityId as string,
					backendId: p.backendId as string,
					title: p.title as string,
					artistName: (p.artistName as string) ?? '',
					artistId: (p.artistId as string) ?? '',
					albumName: (p.albumName as string) ?? '',
					albumId: (p.albumId as string) ?? '',
					thumb: (p.imageUrl as string | null) ?? null,
					artistThumb: null, trackNumber: null, discNumber: null, year: null, albumYear: null,
					duration: (p.durationPlayedMs as number) ?? 0,
					playCount: 0, skipCount: null, userRating: null, lastPlayedAt: null, addedAt: null,
					quality: null, popularity: null, hasLyrics: false, extra: {}
				};
				playTracksNow([track]);
				playCurrentItem();
				break;
			}
			case 'radio_play': {
				const streamUrl = p.streamUrl as string;
				if (!streamUrl) return;
				const station: RadioStation = {
					uuid: p.entityId as string, name: p.title as string, stream_url: streamUrl,
					homepage: '', favicon: (p.imageUrl as string) ?? '',
					tags: ((p.subtitle as string) ?? '').split(' · '),
					country: '', country_code: '', language: '', codec: '', bitrate: 0,
					is_hls: false, votes: 0, click_count: 0, click_trend: 0
				};
				playRadioNow(station);
				playCurrentItem();
				break;
			}
			case 'podcast_play': {
				const audioUrl = p.audioUrl as string;
				const feedUrl = p.feedUrl as string;
				if (!audioUrl || !feedUrl) return;
				const episode: PodcastEpisode = {
					guid: p.entityId as string, title: p.title as string, description: '', pub_date: '',
					duration_secs: Math.round(((p.durationPlayedMs as number) ?? 0) / 1000),
					audio_url: audioUrl, audio_type: 'audio/mpeg', audio_size: 0,
					episode_number: null, season_number: null,
					artwork_url: (p.imageUrl as string | null) ?? null
				};
				playPodcastNow(episode, feedUrl, (p.subtitle as string) ?? '', (p.imageUrl as string) ?? '');
				playCurrentItem();
				break;
			}
		}
	}

	function groupEvents(eventList: AppEvent[]): { label: string; entries: AppEvent[] }[] {
		const groups: { label: string; entries: AppEvent[] }[] = [];
		let currentGroup: (typeof groups)[0] | null = null;
		for (const event of eventList) {
			const label = getDateGroup(event.timestamp);
			if (!currentGroup || currentGroup.label !== label) {
				currentGroup = { label, entries: [] };
				groups.push(currentGroup);
			}
			currentGroup.entries.push(event);
		}
		return groups;
	}

	let grouped = $derived(groupEvents(events));
</script>

<section>
	<!-- Header -->
	<div class="mb-6 flex items-center gap-3">
		<a
			href="/activity"
			class="flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<ArrowLeft size={20} />
		</a>
		<Clock size={28} class="text-accent" />
		<h1 class="text-2xl font-bold">{m.activity_recent_title()}</h1>
	</div>

	<!-- Backend filter chips -->
	{#if breakdown.length > 0}
		<div class="mb-6 flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => setBackendFilter(null)}
				class="rounded-full px-3 py-1 text-xs font-medium transition-colors {backendFilter === null
					? 'bg-accent/30 text-accent'
					: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'}"
			>
				{m.activity_all_backends()}
			</button>
			{#each breakdown as b}
				<button
					type="button"
					onclick={() => setBackendFilter(b.backendId === backendFilter ? null : b.backendId)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {backendFilter === b.backendId
						? 'bg-accent/30 text-accent'
						: b.enabled
							? 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'
							: 'bg-bg-elevated text-text-muted hover:bg-bg-hover opacity-60'}"
				>
					{b.backendId}
					<span class="ml-1 opacity-70">{b.count}</span>
				</button>
			{/each}
			{#if breakdown.some((b) => !b.enabled)}
				<button
					type="button"
					onclick={toggleShowHidden}
					class="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors {showHidden
						? 'bg-accent/20 text-accent'
						: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'}"
				>
					{#if showHidden}
						<EyeOff size={12} /> {m.activity_hide_disabled()}
					{:else}
						<Eye size={12} /> {m.activity_show_hidden()}
					{/if}
				</button>
			{/if}
		</div>
	{/if}

	{#if events.length === 0 && !loading}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<Clock size={48} class="opacity-30" />
			<p class="text-lg">{m.activity_no_recent_plays()}</p>
			<p class="text-sm">{m.activity_no_recent_plays_desc()}</p>
		</div>
	{:else}
		<!-- Recent Artists -->
		{#if recentArtists.length > 0}
			<HorizontalScroller title={m.activity_recent_artists()} baseWidth={130} showUnfold={false}>
				{#each recentArtists as artist}
					<a
						href="/artist/{artist.artistId}"
						class="block shrink-0"
						style:width="var(--scroller-item-width, 130px)"
					>
						<div class="relative">
							<Card
								title={artist.artistName}
								imageUrl={artist.imageUrl ?? undefined}
								rounded
								compact
								playable={false}
							/>
							<div class="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
								<BackendBadge backendId={artist.backendId} size={12} />
							</div>
						</div>
					</a>
				{/each}
			</HorizontalScroller>
		{/if}

		<!-- Recent Albums -->
		{#if recentAlbums.length > 0}
			<HorizontalScroller title={m.activity_recent_albums()} baseWidth={130} showUnfold={false}>
				{#each recentAlbums as album}
					<a
						href="/album/{album.albumId}"
						class="block shrink-0"
						style:width="var(--scroller-item-width, 130px)"
					>
						<div class="relative">
							<Card
								title={album.albumName}
								subtitle={album.artistName}
								imageUrl={album.imageUrl ?? undefined}
								compact
								playable={false}
							/>
							<div class="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
								<BackendBadge backendId={album.backendId} size={12} />
							</div>
						</div>
					</a>
				{/each}
			</HorizontalScroller>
		{/if}

		<!-- Track History -->
		{#each grouped as group}
			<div class="mb-4">
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
					{group.label}
				</h3>
				<div class="space-y-0.5">
					{#each group.entries as event}
						{@const Icon = playTypeIcon(event.type)}
						{@const href = getEventHref(event)}
						{@const canPlay = canPlayEvent(event)}
						{@const p = event.payload}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-bg-hover {href ? 'cursor-pointer' : ''}"
							onclick={(e) => {
								if (href && !(e.target instanceof HTMLElement && e.target.closest('a, button'))) goto(href);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' && href && !(e.target instanceof HTMLElement && e.target.closest('a, button'))) goto(href);
							}}
						>
							<div class="relative h-10 w-10 shrink-0 overflow-hidden rounded">
								{#if p.imageUrl}
									<CachedImage
										src={p.imageUrl as string}
										alt={p.title as string}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
										<Icon size={16} class="text-text-muted" />
									</div>
								{/if}
								{#if canPlay}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											playEvent(event);
										}}
										class="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<Play size={16} fill="white" class="text-white" />
									</button>
								{/if}
								<!-- Backend badge -->
								{#if p.backendId}
									<div class="absolute bottom-0 left-0 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
										<BackendBadge backendId={p.backendId as string} size={10} />
									</div>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-text-primary">{p.title}</p>
								<div class="flex items-center gap-1.5 text-xs text-text-secondary">
									{#if event.type !== 'track_play'}
										<Icon size={10} class="shrink-0 opacity-60" />
									{/if}
									<span class="truncate">{p.subtitle}</span>
									{#if p.albumName}
										<span class="text-text-muted">·</span>
										{#if p.albumId}
											<a
												href="/album/{p.albumId}"
												onclick={(e) => e.stopPropagation()}
												class="truncate hover:text-text-primary hover:underline"
											>{p.albumName}</a>
										{:else}
											<span class="truncate">{p.albumName}</span>
										{/if}
									{/if}
								</div>
							</div>
							<span class="shrink-0 text-xs text-text-muted">{relativeTime(event.timestamp)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		{#if loading}
			<div class="space-y-1 py-2">
				{#each Array(5) as _}
					<div class="flex h-14 animate-pulse items-center gap-3 rounded px-3">
						<div class="h-10 w-10 rounded bg-bg-highlight"></div>
						<div class="flex-1 space-y-1.5">
							<div class="h-3 w-48 rounded bg-bg-highlight"></div>
							<div class="h-2.5 w-32 rounded bg-bg-highlight"></div>
						</div>
						<div class="h-2.5 w-10 rounded bg-bg-highlight"></div>
					</div>
				{/each}
			</div>
		{/if}

		<div bind:this={sentinel} class="h-1"></div>
	{/if}
</section>
