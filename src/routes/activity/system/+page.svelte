<script lang="ts">
	import {
		ArrowLeft,
		AlertCircle,
		Info,
		CheckCircle2,
		AlertTriangle,
		Loader2
	} from 'lucide-svelte';
	import {
		getItems,
		isLoading,
		getActiveOperations,
		getActiveCount,
		loadEvents,
		type AppEvent
	} from '$lib/stores/eventStore.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	const PAGE_SIZE = 50;

	let sentinel: HTMLDivElement | undefined = $state();
	let currentOffset = $state(0);
	let hasMore = $state(true);

	let allItems = $derived(getItems());
	let events = $derived(allItems.filter((e) => e.category === 'system'));
	let loading = $derived(isLoading());
	let activeOps = $derived(getActiveOperations());
	let activeCount = $derived(getActiveCount());

	async function loadAll() {
		currentOffset = 0;
		hasMore = true;
		await loadEvents(PAGE_SIZE, 0, { category: 'system' });
		hasMore = getItems().length >= PAGE_SIZE;
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		currentOffset += PAGE_SIZE;
		const results = await loadEvents(PAGE_SIZE, currentOffset, { category: 'system' });
		hasMore = results.length >= PAGE_SIZE;
	}

	onMount(() => {
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

	function systemLevelIcon(level: string) {
		switch (level) {
			case 'success': return CheckCircle2;
			case 'warn': return AlertTriangle;
			case 'error': return AlertCircle;
			default: return Info;
		}
	}

	const levelColors: Record<string, string> = {
		success: 'text-green-400',
		info: 'text-blue-400',
		warn: 'text-yellow-400',
		error: 'text-red-400'
	};

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
	<div class="mb-6 flex items-center gap-3">
		<a
			href="/activity"
			class="flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
		>
			<ArrowLeft size={20} />
		</a>
		<AlertCircle size={28} class="text-accent" />
		<h1 class="text-2xl font-bold">{m.activity_system_title()}</h1>
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
							<div class="h-full rounded-full bg-accent transition-all" style="width: {payload.progress}%"></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if events.length === 0 && !loading}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-text-muted">
			<AlertCircle size={48} class="opacity-30" />
			<p class="text-lg">{m.activity_system_empty()}</p>
			<p class="text-sm">{m.activity_system_empty_desc()}</p>
		</div>
	{:else}
		{#each grouped as group}
			<div class="mb-4">
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
					{group.label}
				</h3>
				<div class="space-y-0.5">
					{#each group.entries as event}
						{@const p = event.payload}
						{@const level = (p.level as string) ?? 'info'}
						{@const LevelIcon = systemLevelIcon(level)}
						<div class="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-bg-hover">
							<LevelIcon size={16} class="shrink-0 {levelColors[level] ?? 'text-blue-400'}" />
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
			</div>
		{/each}

		{#if loading}
			<div class="space-y-1 py-2">
				{#each Array(3) as _}
					<div class="flex h-14 animate-pulse items-center gap-3 rounded px-3">
						<div class="h-4 w-4 rounded bg-bg-highlight"></div>
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
