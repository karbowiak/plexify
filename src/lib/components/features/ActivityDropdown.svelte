<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Activity, Music, Radio, Podcast, Loader2, Sparkles } from 'lucide-svelte';
	import FloatingCard from '$lib/components/ui/FloatingCard.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import CachedImage from '$lib/components/ui/CachedImage.svelte';
	import {
		getRecentEvents,
		getActiveCount,
		getActiveOperations,
		getUnreadDiscoveryCount,
		clearUnreadDiscoveries,
		clearEvents,
		getItems,
		type AppEvent
	} from '$lib/stores/eventStore.svelte';

	let open = $state(false);
	let now = $state(Date.now());
	let timer: ReturnType<typeof setInterval> | null = null;
	let activeTab = $state<'activity' | 'discoveries'>('activity');

	// Update relative timestamps every 30s while open
	$effect(() => {
		if (open) {
			now = Date.now();
			timer = setInterval(() => (now = Date.now()), 30_000);
		} else if (timer) {
			clearInterval(timer);
			timer = null;
		}
		return () => {
			if (timer) clearInterval(timer);
		};
	});

	// Clear unread discoveries when dropdown opens
	$effect(() => {
		if (open) {
			clearUnreadDiscoveries();
		}
	});

	// Clear unread when discoveries tab is selected
	$effect(() => {
		if (activeTab === 'discoveries') {
			clearUnreadDiscoveries();
		}
	});

	let allItems = $derived(getRecentEvents(20));
	let discoveryItems = $derived(getItems().filter((e) => e.category === 'discovery').slice(0, 20));
	let items = $derived(activeTab === 'discoveries' ? discoveryItems : allItems);
	let activeCount = $derived(getActiveCount());
	let activeOps = $derived(getActiveOperations());
	let unreadCount = $derived(getUnreadDiscoveryCount());

	const levelDotColors: Record<string, string> = {
		success: 'bg-green-400',
		info: 'bg-blue-400',
		warn: 'bg-yellow-400',
		error: 'bg-red-400'
	};

	function relativeTime(timestamp: Date, _now: number): string {
		const diff = _now - new Date(timestamp).getTime();
		const secs = Math.floor(diff / 1000);
		if (secs < 5) return m.time_just_now();
		if (secs < 60) return m.time_seconds_ago({ count: secs });
		const mins = Math.floor(secs / 60);
		if (mins < 60) return m.time_minutes_ago({ count: mins });
		const hours = Math.floor(mins / 60);
		if (hours < 24) return m.time_hours_ago({ count: hours });
		return m.time_days_ago({ count: Math.floor(hours / 24) });
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
				return null;
		}
	}

	function isPlayEvent(event: AppEvent): boolean {
		return event.category === 'play';
	}

	function isDiscoveryEvent(event: AppEvent): boolean {
		return event.category === 'discovery';
	}
</script>

<FloatingCard bind:open position="below" align="end">
	{#snippet trigger()}
		<div class="relative">
			<IconButton icon={Activity} label={m.nav_activity()} active={open} />
			{#if activeCount > 0}
				<svg
					class="pointer-events-none absolute -inset-1 animate-spin"
					viewBox="0 0 36 36"
					fill="none"
				>
					<circle
						cx="18"
						cy="18"
						r="16"
						stroke="currentColor"
						stroke-width="2"
						stroke-dasharray="25 75"
						class="text-accent"
					/>
				</svg>
			{/if}
			{#if unreadCount > 0}
				<span
					class="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-bg-base"
				>
					{unreadCount > 99 ? '99+' : unreadCount}
				</span>
			{/if}
		</div>
	{/snippet}
	{#snippet children()}
		<div class="w-96 p-4">
			<!-- Tabs + header -->
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={() => (activeTab = 'activity')}
						class="rounded-md px-2.5 py-1 text-sm font-medium transition-colors {activeTab === 'activity'
							? 'bg-bg-elevated text-text-primary'
							: 'text-text-muted hover:text-text-primary'}"
					>
						{m.nav_activity()}
					</button>
					<button
						type="button"
						onclick={() => (activeTab = 'discoveries')}
						class="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-colors {activeTab === 'discoveries'
							? 'bg-bg-elevated text-text-primary'
							: 'text-text-muted hover:text-text-primary'}"
					>
						<Sparkles size={12} />
						{m.nav_discoveries()}
					</button>
				</div>
				<div class="flex items-center gap-2">
					<a
						href={activeTab === 'discoveries' ? '/activity/discoveries' : '/activity'}
						class="text-xs text-text-muted transition-colors hover:text-text-primary"
						onclick={() => (open = false)}
					>
						{m.action_view_all()}
					</a>
					{#if items.length > 0 && activeTab === 'activity'}
						<button
							type="button"
							class="text-xs text-text-muted transition-colors hover:text-text-primary"
							onclick={() => clearEvents()}
						>
							{m.action_clear()}
						</button>
					{/if}
				</div>
			</div>

			<!-- Active operations (only in activity tab) -->
			{#if activeCount > 0 && activeTab === 'activity'}
				<div class="mb-2 space-y-1">
					{#each [...activeOps.entries()] as [opId, payload]}
						<div class="flex items-center gap-2 rounded-md bg-bg-elevated px-2 py-1.5">
							<Loader2 size={12} class="shrink-0 animate-spin text-accent" />
							<p class="min-w-0 truncate text-xs text-text-primary">{payload.message ?? m.activity_working()}</p>
						</div>
					{/each}
				</div>
			{/if}

			{#if items.length === 0 && (activeTab === 'discoveries' || activeCount === 0)}
				<p class="py-6 text-center text-sm text-text-muted">
					{activeTab === 'discoveries' ? m.activity_no_discoveries() : m.activity_no_activity()}
				</p>
			{:else}
				<div class="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
					{#each items as item}
						{@const isPlay = isPlayEvent(item)}
						{@const isDiscovery = isDiscoveryEvent(item)}
						{@const p = item.payload}

						{#if isPlay}
							{@const Icon = playTypeIcon(item.type)}
							<!-- Play event: compact with artwork -->
							<div class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent-tint-hover">
								<div class="h-8 w-8 shrink-0 overflow-hidden rounded">
									{#if p.imageUrl}
										<CachedImage
											src={p.imageUrl as string}
											alt={p.title as string}
											class="h-full w-full object-cover"
										/>
									{:else if item.type === 'track_play'}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
											<Music size={12} class="text-text-muted" />
										</div>
									{:else if item.type === 'radio_play'}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
											<Radio size={12} class="text-text-muted" />
										</div>
									{:else if item.type === 'podcast_play'}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
											<Podcast size={12} class="text-text-muted" />
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium text-text-primary">{p.title}</p>
									<p class="truncate text-xs text-text-muted">{p.subtitle}</p>
								</div>
								<span class="shrink-0 text-xs text-text-muted">{relativeTime(item.timestamp, now)}</span>
							</div>
						{:else if isDiscovery}
							<!-- Discovery event -->
							<div class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent-tint-hover">
								<div class="h-8 w-8 shrink-0 overflow-hidden rounded">
									{#if p.imageUrl}
										<CachedImage
											src={p.imageUrl as string}
											alt={p.title as string}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-bg-highlight">
											<Sparkles size={12} class="text-accent" />
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium text-text-primary">{p.title}</p>
									{#if p.subtitle}
										<p class="truncate text-xs text-text-muted">{p.subtitle}</p>
									{/if}
								</div>
								<span class="shrink-0 text-xs text-text-muted">{relativeTime(item.timestamp, now)}</span>
							</div>
						{:else}
							<!-- System event -->
							<div class="rounded-md px-2 py-1.5 transition-colors hover:bg-accent-tint-hover">
								<div class="flex items-start gap-2">
									<span
										class="mt-1.5 h-2 w-2 shrink-0 rounded-full {levelDotColors[(p.level as string) ?? 'info'] ?? 'bg-blue-400'}"
									></span>
									<div class="min-w-0 flex-1">
										<p class="text-sm text-text-primary">{p.message}</p>
										<div class="flex items-center gap-2">
											{#if p.detail}
												<p class="min-w-0 truncate text-xs text-text-muted">{p.detail}</p>
											{/if}
											<span class="shrink-0 text-xs text-text-muted">{relativeTime(item.timestamp, now)}</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}
</FloatingCard>
