<script lang="ts">
	import {
		Activity,
		Trash2,
		Radio,
		Podcast,
		Music,
		Play,
		Loader2,
		AlertCircle,
		Sparkles,
		ArrowRight
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import {
		getItems,
		getTotalCount,
		isLoading,
		getActiveOperations,
		getActiveCount,
		loadEvents,
		clearEvents,
		type AppEvent
	} from '$lib/stores/eventStore.svelte';
	import { playTracksNow, playRadioNow, playPodcastNow } from '$lib/stores/unifiedQueue.svelte';
	import { playCurrentItem } from '$lib/stores/playerStore.svelte';
	import type { Track } from '$lib/backends/models/track';
	import type { RadioStation } from '$lib/backends/models/radioStation';
	import type { PodcastEpisode } from '$lib/backends/models/podcast';

	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	let confirmClear = $state(false);
	let itemLimit = $state(10);

	// Compute once on mount — no ResizeObserver needed
	onMount(() => {
		const available = window.innerHeight - 140;
		itemLimit = Math.max(5, Math.floor(available / 44));
	});

	let events = $derived(getItems());
	let totalCount = $derived(getTotalCount());
	let loading = $derived(isLoading());
	let activeOps = $derived(getActiveOperations());
	let activeCount = $derived(getActiveCount());

	let playEvents = $derived(events.filter((e) => e.category === 'play').slice(0, itemLimit));
	let systemEvents = $derived(events.filter((e) => e.category === 'system').slice(0, itemLimit));
	let discoveryEvents = $derived(events.filter((e) => e.category === 'discovery').slice(0, itemLimit));

	onMount(() => {
		loadEvents(100);
	});

	const levelDotColors: Record<string, string> = {
		success: 'bg-green-400',
		info: 'bg-blue-400',
		warn: 'bg-yellow-400',
		error: 'bg-red-400'
	};

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
			case 'track_play':
				return Music;
			case 'radio_play':
				return Radio;
			case 'podcast_play':
				return Podcast;
			default:
				return Music;
		}
	}

	function getEventHref(event: AppEvent): string | null {
		const p = event.payload;
		switch (event.type) {
			case 'track_play':
				return p.artistId ? `/artist/${p.artistId}` : null;
			case 'podcast_play':
				return p.feedUrl ? `/podcasts/${btoa(p.feedUrl as string)}` : null;
			case 'radio_play':
				return '/radio';
			default:
				return null;
		}
	}

	function canPlayEvent(event: AppEvent): boolean {
		const p = event.payload;
		switch (event.type) {
			case 'track_play':
				return true;
			case 'radio_play':
				return !!p.streamUrl;
			case 'podcast_play':
				return !!p.audioUrl && !!p.feedUrl;
			default:
				return false;
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
					artistThumb: null,
					trackNumber: null,
					discNumber: null,
					year: null,
					albumYear: null,
					duration: (p.durationPlayedMs as number) ?? 0,
					playCount: 0,
					skipCount: null,
					userRating: null,
					lastPlayedAt: null,
					addedAt: null,
					quality: null,
					popularity: null,
					hasLyrics: false,
					extra: {}
				};
				playTracksNow([track]);
				playCurrentItem();
				break;
			}
			case 'radio_play': {
				const streamUrl = p.streamUrl as string;
				if (!streamUrl) return;
				const station: RadioStation = {
					uuid: p.entityId as string,
					name: p.title as string,
					stream_url: streamUrl,
					homepage: '',
					favicon: (p.imageUrl as string) ?? '',
					tags: ((p.subtitle as string) ?? '').split(' · '),
					country: '',
					country_code: '',
					language: '',
					codec: '',
					bitrate: 0,
					is_hls: false,
					votes: 0,
					click_count: 0,
					click_trend: 0
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
					guid: p.entityId as string,
					title: p.title as string,
					description: '',
					pub_date: '',
					duration_secs: Math.round(((p.durationPlayedMs as number) ?? 0) / 1000),
					audio_url: audioUrl,
					audio_type: 'audio/mpeg',
					audio_size: 0,
					episode_number: null,
					season_number: null,
					artwork_url: (p.imageUrl as string | null) ?? null
				};
				playPodcastNow(episode, feedUrl, (p.subtitle as string) ?? '', (p.imageUrl as string) ?? '');
				playCurrentItem();
				break;
			}
		}
	}

	async function handleClear() {
		await clearEvents();
		confirmClear = false;
	}
</script>

<section class="flex h-full flex-col overflow-hidden">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Activity size={28} class="text-accent" />
			<h1 class="text-2xl font-bold">{m.activity_title()}</h1>
			{#if totalCount > 0}
				<span class="text-sm text-text-muted">{m.activity_events_count({ count: totalCount })}</span>
			{/if}
		</div>
		{#if totalCount > 0}
			{#if confirmClear}
				<div class="flex items-center gap-2">
					<span class="text-sm text-text-secondary">{m.activity_clear_confirm()}</span>
					<button
						type="button"
						onclick={handleClear}
						class="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
					>
						{m.action_confirm()}
					</button>
					<button
						type="button"
						onclick={() => (confirmClear = false)}
						class="rounded-lg bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
					>
						{m.action_cancel()}
					</button>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => (confirmClear = true)}
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
				>
					<Trash2 size={14} />
					{m.action_clear()}
				</button>
			{/if}
		{/if}
	</div>

	<!-- Active Operations -->
	{#if activeCount > 0}
		<div class="mb-6 space-y-1">
			{#each [...activeOps.entries()] as [opId, payload]}
				<div class="flex items-center gap-3 rounded-lg bg-bg-elevated px-4 py-2.5">
					<Loader2 size={16} class="shrink-0 animate-spin text-accent" />
					<div class="min-w-0 flex-1">
						<p class="text-sm text-text-primary">{payload.message ?? m.activity_working()}</p>
						{#if payload.detail}
							<p class="truncate text-xs text-text-muted">{payload.detail}</p>
						{/if}
					</div>
					{#if typeof payload.progress === 'number'}
						<div class="h-1.5 w-20 overflow-hidden rounded-full bg-bg-hover">
							<div
								class="h-full rounded-full bg-accent transition-all"
								style="width: {payload.progress}%"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if events.length === 0 && !loading}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<Activity size={48} class="opacity-30" />
			<p class="text-lg">{m.activity_no_activity()}</p>
			<p class="text-sm">{m.activity_no_activity_desc()}</p>
		</div>
	{:else}
		<!-- 3-column summary — fill remaining page height -->
		<div class="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Recent Plays -->
			<div class="flex min-h-0 flex-col">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
						<Music size={12} /> {m.activity_recent()}
					</h2>
					<a href="/activity/recent" class="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary">
						{m.action_view_all()} <ArrowRight size={12} />
					</a>
				</div>
				{#if playEvents.length === 0}
					<p class="py-4 text-center text-xs text-text-muted">{m.activity_no_plays()}</p>
				{:else}
					<div class="min-h-0 flex-1 space-y-0.5 overflow-hidden">
						{#each playEvents as event}
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
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-text-primary">{p.title}</p>
									<div class="flex items-center gap-1.5 text-xs text-text-secondary">
										{#if event.type !== 'track_play'}
											<Icon size={10} class="shrink-0 opacity-60" />
										{/if}
										<span class="truncate">{p.subtitle}</span>
									</div>
								</div>
								<span class="shrink-0 text-xs text-text-muted">{relativeTime(event.timestamp)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- System -->
			<div class="flex min-h-0 flex-col">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
						<AlertCircle size={12} /> {m.activity_system()}
					</h2>
					<a href="/activity/system" class="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary">
						{m.action_view_all()} <ArrowRight size={12} />
					</a>
				</div>
				{#if systemEvents.length === 0}
					<p class="py-4 text-center text-xs text-text-muted">{m.activity_no_system_events()}</p>
				{:else}
					<div class="min-h-0 flex-1 space-y-0.5 overflow-hidden">
						{#each systemEvents as event}
							{@const p = event.payload}
							{@const level = (p.level as string) ?? 'info'}
							<div class="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-bg-hover">
								<span
									class="mt-0.5 h-2 w-2 shrink-0 rounded-full {levelDotColors[level] ?? 'bg-blue-400'}"
								></span>
								<div class="min-w-0 flex-1">
									<p class="text-sm text-text-primary">{p.message}</p>
									{#if p.detail}
										<p class="truncate text-xs text-text-muted">{p.detail}</p>
									{/if}
								</div>
								<span class="shrink-0 text-xs text-text-muted">{relativeTime(event.timestamp)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Discoveries -->
			<div class="flex min-h-0 flex-col">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
						<Sparkles size={12} /> {m.activity_discoveries()}
					</h2>
					<a href="/activity/discoveries" class="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary">
						{m.action_view_all()} <ArrowRight size={12} />
					</a>
				</div>
				{#if discoveryEvents.length === 0}
					<p class="py-4 text-center text-xs text-text-muted">{m.activity_no_discoveries()}</p>
				{:else}
					<div class="min-h-0 flex-1 space-y-0.5 overflow-hidden">
						{#each discoveryEvents as event}
							{@const p = event.payload}
							<div class="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-bg-hover">
								<div class="h-10 w-10 shrink-0 overflow-hidden rounded">
									{#if p.imageUrl}
										<CachedImage
											src={p.imageUrl as string}
											alt={p.title as string}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
											<Sparkles size={16} class="text-accent" />
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									{#if p.href}
										<a href={p.href as string} class="truncate text-sm font-medium text-text-primary hover:underline">
											{p.title}
										</a>
									{:else}
										<p class="truncate text-sm font-medium text-text-primary">{p.title}</p>
									{/if}
									{#if p.subtitle}
										<p class="truncate text-xs text-text-secondary">{p.subtitle}</p>
									{/if}
								</div>
								<span class="shrink-0 text-xs text-text-muted">{relativeTime(event.timestamp)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
