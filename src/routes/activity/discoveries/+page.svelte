<script lang="ts">
	import { Sparkles, ArrowLeft } from 'lucide-svelte';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import HorizontalScroller from '$lib/components/ui/HorizontalScroller.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import {
		getItems,
		loadEvents,
		isLoading,
		getTotalCount,
		clearUnreadDiscoveries,
		type AppEvent
	} from '$lib/stores/eventStore.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	const PAGE_SIZE = 50;

	let sentinel: HTMLDivElement | undefined = $state();
	let currentOffset = $state(0);
	let hasMore = $state(true);

	let allItems = $derived(getItems());
	let events = $derived(allItems.filter((e) => e.category === 'discovery'));
	let loading = $derived(isLoading());
	let totalCount = $derived(getTotalCount());

	// Featured: events with images that are new_album or recommendation, deduplicated by title
	let featuredEvents = $derived.by(() => {
		const seen = new Set<string>();
		const results: AppEvent[] = [];
		for (const e of events) {
			if (e.type !== 'new_album' && e.type !== 'recommendation') continue;
			if (!e.payload.imageUrl) continue;
			const key = e.payload.title as string;
			if (seen.has(key)) continue;
			seen.add(key);
			results.push(e);
			if (results.length >= 12) break;
		}
		return results;
	});

	// Clear unread discoveries when visiting this page
	clearUnreadDiscoveries();

	async function loadAll() {
		currentOffset = 0;
		hasMore = true;
		await loadEvents(PAGE_SIZE, 0, { category: 'discovery' });
		hasMore = getItems().length >= PAGE_SIZE;
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		currentOffset += PAGE_SIZE;
		const results = await loadEvents(PAGE_SIZE, currentOffset, { category: 'discovery' });
		hasMore = results.length >= PAGE_SIZE;
	}

	onMount(() => {
		loadAll();
	});

	// Infinite scroll
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

		const d = new Date(date);
		const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

		if (entryDay.getTime() >= today.getTime()) return m.time_today();
		if (entryDay.getTime() >= yesterday.getTime()) return m.time_yesterday();
		if (entryDay.getTime() >= weekStart.getTime()) return m.time_this_week();
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
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/activity"
				class="flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
			>
				<ArrowLeft size={20} />
			</a>
			<Sparkles size={28} class="text-accent" />
			<h1 class="text-2xl font-bold">{m.activity_discoveries_title()}</h1>
			{#if events.length > 0}
				<span class="text-sm text-text-muted">({events.length})</span>
			{/if}
		</div>
	</div>

	{#if events.length === 0 && !loading}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<Sparkles size={48} class="opacity-30" />
			<p class="text-lg">{m.activity_discoveries_empty()}</p>
			<p class="text-sm">{m.activity_discoveries_empty_desc()}</p>
		</div>
	{:else}
		<!-- Featured Discoveries -->
		{#if featuredEvents.length > 0}
			<HorizontalScroller title={m.activity_discoveries_featured()} baseWidth={150} showUnfold={false}>
				{#each featuredEvents as event}
					{@const p = event.payload}
					{#if p.href}
						<a
							href={p.href as string}
							class="block shrink-0"
							style:width="var(--scroller-item-width, 150px)"
						>
							<Card
								title={p.title as string}
								subtitle={p.subtitle as string | undefined}
								imageUrl={p.imageUrl as string | undefined}
								compact
								playable={false}
							/>
						</a>
					{:else}
						<div class="shrink-0" style:width="var(--scroller-item-width, 150px)">
							<Card
								title={p.title as string}
								subtitle={p.subtitle as string | undefined}
								imageUrl={p.imageUrl as string | undefined}
								compact
								playable={false}
							/>
						</div>
					{/if}
				{/each}
			</HorizontalScroller>
		{/if}

		<!-- Timeline -->
		{#each grouped as group}
			<div class="mb-4">
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
					{group.label}
				</h3>
				<div class="space-y-0.5">
					{#each group.entries as event}
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
							<span class="shrink-0 text-xs text-text-muted">
								{relativeTime(event.timestamp)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		{#if loading}
			<div class="space-y-1 py-2">
				{#each Array(3) as _}
					<div class="flex h-14 animate-pulse items-center gap-3 rounded px-3">
						<div class="h-10 w-10 rounded bg-bg-highlight"></div>
						<div class="flex-1 space-y-1.5">
							<div class="h-3 w-48 rounded bg-bg-highlight"></div>
							<div class="h-2.5 w-32 rounded bg-bg-highlight"></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div bind:this={sentinel} class="h-1"></div>
	{/if}
</section>
