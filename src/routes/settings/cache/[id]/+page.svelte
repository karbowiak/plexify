<script lang="ts">
	import { Trash2, HardDrive, FolderOpen, Clock, Database, RefreshCw, Lock, ArrowLeft } from 'lucide-svelte';
	import { getCache, setCache } from '$lib/stores/configStore.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	let cacheId = $derived(data.cacheId);
	let config = $derived(getCache(cacheId));

	interface EnvLocks {
		directory: boolean;
		maxSizeMB: boolean;
		ttlDays: boolean;
	}

	interface Stats {
		totalSizeBytes: number;
		entryCount: number;
		oldestEntry: number | null;
		newestEntry: number | null;
		directory: string;
		maxSizeMB: number;
		ttlDays: number;
		envLocks: EnvLocks;
	}

	let stats = $state<Stats | null>(data.initialStats);
	let clearing = $state(false);
	let syncing = $state(false);
	let fetching = $state(false);

	// Re-sync stats when navigating between cache pages
	$effect(() => {
		// Access cacheId to create reactive dependency
		cacheId;
		stats = data.initialStats;
	});

	let locks = $derived(stats?.envLocks ?? { directory: false, maxSizeMB: false, ttlDays: false });

	// In-memory caches have all locks set to true and maxSizeMB=0
	let isInMemory = $derived(locks.directory && locks.maxSizeMB && locks.ttlDays);
	let isConfigurable = $derived(!isInMemory);

	const maxSizeOptions = [
		{ label: () => m.cache_size_100mb(), value: 100 },
		{ label: () => m.cache_size_250mb(), value: 250 },
		{ label: () => m.cache_size_500mb(), value: 500 },
		{ label: () => m.cache_size_1gb(), value: 1024 },
		{ label: () => m.cache_size_2gb(), value: 2048 },
		{ label: () => m.cache_size_5gb(), value: 5120 }
	];

	const ttlOptions = [
		{ label: () => m.cache_ttl_1d(), value: 1 },
		{ label: () => m.cache_ttl_3d(), value: 3 },
		{ label: () => m.cache_ttl_1w(), value: 7 },
		{ label: () => m.cache_ttl_2w(), value: 14 },
		{ label: () => m.cache_ttl_1m(), value: 30 },
		{ label: () => m.cache_ttl_forever(), value: 90 }
	];

	interface CacheInfo {
		name: string;
		description: string;
		howItWorks: string[];
	}

	function getCacheInfo(id: string): CacheInfo {
		switch (id) {
			case 'media': return {
				name: m.cache_media_name(),
				description: m.cache_media_desc(),
				howItWorks: [m.cache_media_how_1(), m.cache_media_how_2(), m.cache_media_how_3(), m.cache_media_how_4(), m.cache_media_how_5()]
			};
			case 'image': return {
				name: m.cache_image_name(),
				description: m.cache_image_desc(),
				howItWorks: [m.cache_image_how_1(), m.cache_image_how_2(), m.cache_image_how_3(), m.cache_image_how_4()]
			};
			case 'metadata': return {
				name: m.cache_metadata_name(),
				description: m.cache_metadata_desc(),
				howItWorks: [m.cache_metadata_how_1(), m.cache_metadata_how_2(), m.cache_metadata_how_3()]
			};
			case 'audio-analysis': return {
				name: m.cache_audio_analysis_name(),
				description: m.cache_audio_analysis_desc(),
				howItWorks: [m.cache_audio_analysis_how_1(), m.cache_audio_analysis_how_2(), m.cache_audio_analysis_how_3()]
			};
			case 'api': return {
				name: m.cache_api_name(),
				description: m.cache_api_desc(),
				howItWorks: [m.cache_api_how_1(), m.cache_api_how_2(), m.cache_api_how_3()]
			};
			default: return {
				name: m.cache_fallback_name({ id }),
				description: '',
				howItWorks: []
			};
		}
	}

	let info = $derived(getCacheInfo(cacheId));

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
	}

	function formatDate(ms: number | null): string {
		if (!ms) return m.cache_na();
		const d = new Date(ms);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	let effectiveMaxSizeMB = $derived(locks.maxSizeMB && stats ? stats.maxSizeMB : config.maxSizeMB);
	let effectiveDirectory = $derived(locks.directory && stats ? stats.directory : config.directory);
	let effectiveTtlDays = $derived(locks.ttlDays && stats ? stats.ttlDays : config.ttlDays);

	function usagePercent(): number {
		if (!stats || effectiveMaxSizeMB === 0) return 0;
		return Math.min(100, (stats.totalSizeBytes / (effectiveMaxSizeMB * 1024 * 1024)) * 100);
	}

	async function syncToServer(patch: Partial<{ directory: string; maxSizeMB: number; ttlDays: number }>) {
		syncing = true;
		try {
			const res = await fetch(`/api/cache/${cacheId}/stats`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patch)
			});
			if (res.ok) stats = await res.json();
		} catch { /* ignore */ }
		syncing = false;
	}

	async function fetchStats() {
		fetching = true;
		try {
			const res = await fetch(`/api/cache/${cacheId}/stats`);
			if (res.ok) stats = await res.json();
		} catch { /* ignore */ }
		fetching = false;
	}

	async function clearCacheAction() {
		clearing = true;
		try {
			await fetch(`/api/cache/${cacheId}/stats`, { method: 'DELETE' });
			await fetchStats();
		} catch { /* ignore */ }
		clearing = false;
	}

	function updateDirectory(value: string) {
		if (locks.directory) return;
		setCache(cacheId, { directory: value });
		syncToServer({ directory: value });
	}

	function updateMaxSize(value: number) {
		if (locks.maxSizeMB) return;
		setCache(cacheId, { maxSizeMB: value });
		syncToServer({ maxSizeMB: value });
	}

	function updateTtl(value: number) {
		if (locks.ttlDays) return;
		setCache(cacheId, { ttlDays: value });
		syncToServer({ ttlDays: value });
	}


</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<a href="/settings/cache" class="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-overlay-subtle hover:text-text-primary">
			<ArrowLeft size={18} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-text-primary">{info.name}</h1>
			{#if info.description}
				<p class="mt-0.5 text-xs text-text-secondary">{info.description}</p>
			{/if}
		</div>
	</div>

	<!-- Overview -->
	<div class="rounded-xl border border-border bg-bg-elevated">
		<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.cache_overview()}</h2>

		<div class="px-6 py-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
					<Database size={22} class="text-accent" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline gap-2">
						<p class="text-lg font-semibold text-text-primary">
							{#if stats}
								{formatBytes(stats.totalSizeBytes)}
							{:else}
								...
							{/if}
						</p>
						{#if isConfigurable && effectiveMaxSizeMB > 0}
							<p class="text-xs text-text-muted">
								/ {effectiveMaxSizeMB >= 1024
									? `${(effectiveMaxSizeMB / 1024).toFixed(effectiveMaxSizeMB % 1024 === 0 ? 0 : 1)} GB`
									: `${effectiveMaxSizeMB} MB`}
							</p>
						{:else if isInMemory}
							<span class="rounded-full bg-overlay-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">{m.cache_in_memory()}</span>
						{/if}
					</div>
					{#if isConfigurable && effectiveMaxSizeMB > 0}
						<!-- Usage bar -->
						<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-overlay-medium">
							<div
								class="h-full rounded-full transition-all duration-500 {usagePercent() > 90
									? 'bg-red-500'
									: usagePercent() > 70
										? 'bg-amber-500'
										: 'bg-accent'}"
								style:width="{usagePercent()}%"
							></div>
						</div>
					{/if}
				</div>
			</div>

			{#if stats}
				<div class="mt-4 flex flex-wrap gap-3">
					<div class="rounded-lg bg-overlay-subtle px-3 py-2">
						<p class="text-[10px] font-medium uppercase tracking-wider text-text-muted">{m.cache_stat_entries()}</p>
						<p class="text-sm font-semibold text-text-primary">{stats.entryCount.toLocaleString()}</p>
					</div>
					{#if stats.oldestEntry}
						<div class="rounded-lg bg-overlay-subtle px-3 py-2">
							<p class="text-[10px] font-medium uppercase tracking-wider text-text-muted">{m.cache_stat_oldest()}</p>
							<p class="text-sm font-semibold text-text-primary">{formatDate(stats.oldestEntry)}</p>
						</div>
					{/if}
					{#if stats.newestEntry}
						<div class="rounded-lg bg-overlay-subtle px-3 py-2">
							<p class="text-[10px] font-medium uppercase tracking-wider text-text-muted">{m.cache_stat_newest()}</p>
							<p class="text-sm font-semibold text-text-primary">{formatDate(stats.newestEntry)}</p>
						</div>
					{/if}
					{#if isInMemory}
						<div class="rounded-lg bg-overlay-subtle px-3 py-2">
							<p class="text-[10px] font-medium uppercase tracking-wider text-text-muted">{m.cache_stat_storage()}</p>
							<p class="text-sm font-semibold text-text-primary">{stats.directory}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="mx-6 h-px bg-border"></div>

		<!-- Actions -->
		<div class="flex items-center gap-2 px-6 py-4 pb-5">
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
				onclick={clearCacheAction}
				disabled={clearing}
			>
				<Trash2 size={14} />
				{clearing ? m.cache_clearing() : m.cache_clear()}
			</button>
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent disabled:opacity-50"
				onclick={fetchStats}
				disabled={fetching}
			>
				<RefreshCw size={14} class={fetching ? 'animate-spin' : ''} />
				{m.action_refresh()}
			</button>
		</div>
	</div>

	<!-- Settings (only for configurable/disk caches) -->
	{#if isConfigurable}
		<div class="rounded-xl border border-border bg-bg-elevated">
			<h2 class="px-6 pt-5 pb-3 text-sm font-semibold text-accent">{m.cache_settings()}</h2>

			<!-- Cache directory -->
			<div class="flex items-center justify-between px-6 py-4">
				<div>
					<div class="flex items-center gap-2">
						<p class="text-sm font-medium text-text-primary">{m.cache_directory()}</p>
						{#if locks.directory}
							<span class="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
								<Lock size={10} />
								{m.cache_env()}
							</span>
						{/if}
					</div>
					<p class="text-xs text-text-secondary">
						{#if locks.directory}
							{m.cache_set_by_env()}
						{:else}
							{m.cache_directory_desc()}
						{/if}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<FolderOpen size={14} class="text-text-muted" />
					<input
						type="text"
						value={effectiveDirectory}
						onchange={(e) => updateDirectory((e.target as HTMLInputElement).value)}
						disabled={locks.directory}
						class="w-48 rounded-md border border-border bg-bg-base px-2.5 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
						placeholder=".cache/img"
					/>
				</div>
			</div>

			<div class="mx-6 h-px bg-border"></div>

			<!-- Max cache size -->
			<div class="flex items-center justify-between px-6 py-4">
				<div>
					<div class="flex items-center gap-2">
						<p class="text-sm font-medium text-text-primary">{m.cache_max_size()}</p>
						{#if locks.maxSizeMB}
							<span class="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
								<Lock size={10} />
								{m.cache_env()}
							</span>
						{/if}
					</div>
					<p class="text-xs text-text-secondary">
						{#if locks.maxSizeMB}
							{m.cache_set_by_env()}
						{:else}
							{m.cache_max_size_desc()}
						{/if}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<HardDrive size={14} class="text-text-muted" />
					<select
						value={effectiveMaxSizeMB}
						onchange={(e) => updateMaxSize(Number((e.target as HTMLSelectElement).value))}
						disabled={locks.maxSizeMB}
						class="rounded-md border border-border bg-bg-base px-2.5 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#each maxSizeOptions as opt}
							<option value={opt.value} selected={opt.value === effectiveMaxSizeMB}>{opt.label()}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="mx-6 h-px bg-border"></div>

			<!-- TTL -->
			<div class="flex items-center justify-between px-6 py-4 pb-5">
				<div>
					<div class="flex items-center gap-2">
						<p class="text-sm font-medium text-text-primary">{m.cache_ttl()}</p>
						{#if locks.ttlDays}
							<span class="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
								<Lock size={10} />
								{m.cache_env()}
							</span>
						{/if}
					</div>
					<p class="text-xs text-text-secondary">
						{#if locks.ttlDays}
							{m.cache_set_by_env()}
						{:else}
							{m.cache_ttl_desc()}
						{/if}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Clock size={14} class="text-text-muted" />
					<select
						value={effectiveTtlDays}
						onchange={(e) => updateTtl(Number((e.target as HTMLSelectElement).value))}
						disabled={locks.ttlDays}
						class="rounded-md border border-border bg-bg-base px-2.5 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#each ttlOptions as opt}
							<option value={opt.value} selected={opt.value === effectiveTtlDays}>{opt.label()}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	{/if}

	<!-- How it Works -->
	{#if info.howItWorks.length > 0}
		<div class="rounded-xl border border-border/60 bg-bg-elevated/60 p-6">
			<h2 class="mb-3 text-sm font-semibold text-text-primary">{m.cache_how_it_works()}</h2>
			<div class="space-y-2 text-xs text-text-secondary">
				{#each info.howItWorks as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>
	{/if}
</div>
