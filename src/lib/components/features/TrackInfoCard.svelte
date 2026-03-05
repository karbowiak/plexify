<script lang="ts">
	import { Info, Copy, Check } from 'lucide-svelte';
	import FloatingCard from '$lib/components/ui/FloatingCard.svelte';
	import { getCurrentItem, type QueueItem } from '$lib/stores/unifiedQueue.svelte';
	import { getEngineDebugInfo, getTrackAnalysis } from '$lib/stores/playerStore.svelte';
	import { getDebugEnabled, setDebugEnabled } from '$lib/stores/configStore.svelte';
	import {
		formatBitrate,
		formatSampleRate,
		formatBitDepth,
		formatChannels,
		formatGainDb,
		formatLufs,
		formatQualityBadge,
		formatDuration
	} from '$lib/utils/format';
	import type { AudioQuality } from '$lib/backends/models/track';
	import type { EngineDebugInfo, TrackAnalysis } from '$lib/audio/types';

	let open = $state(false);
	let copied = $state(false);
	let debugInfo = $state<EngineDebugInfo | null>(null);
	let analysis = $state<TrackAnalysis | null>(null);
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	let item = $derived(getCurrentItem());
	let debugEnabled = $derived(getDebugEnabled());

	// Extract quality data based on item type
	let quality = $derived.by((): AudioQuality | null => {
		if (!item) return null;
		if (item.type === 'track') return item.data.quality;
		return null;
	});

	let badgeText = $derived.by(() => {
		if (!item) return '';
		if (item.type === 'track' && quality) {
			return formatQualityBadge(quality.codec, quality.bitrate, quality.bitDepth, quality.sampleRate);
		}
		if (item.type === 'radio') return 'RADIO';
		if (item.type === 'podcast') return 'PODCAST';
		return '';
	});

	// Refresh debug info when panel is open
	$effect(() => {
		if (open) {
			refreshDebugInfo();
			refreshTimer = setInterval(refreshDebugInfo, 1000);
		} else {
			if (refreshTimer) {
				clearInterval(refreshTimer);
				refreshTimer = null;
			}
		}
		return () => {
			if (refreshTimer) clearInterval(refreshTimer);
		};
	});

	function refreshDebugInfo() {
		debugInfo = getEngineDebugInfo();
		if (item?.type === 'track') {
			analysis = getTrackAnalysis(item.data.id);
		} else {
			analysis = null;
		}
	}

	function copyJson() {
		const data = {
			item: item ? { type: item.type, data: item.data } : null,
			engine: debugInfo,
			analysis
		};
		navigator.clipboard.writeText(JSON.stringify(data, null, 2));
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function row(label: string, value: string | number | null | undefined): { label: string; value: string } {
		return { label, value: value != null && value !== '' ? String(value) : '—' };
	}

	let hasCrossfadeAnalysis = $derived(
		debugInfo?.crossfadeWindowMs != null && debugInfo.crossfadeWindowMs > 0 && analysis != null
	);

	// Build info rows
	let trackRows = $derived.by(() => {
		if (!item) return [];
		if (item.type === 'track') {
			const t = item.data;
			const q = t.quality;
			const rows = [
				row('Title', t.title),
				row('Artist', t.artistName),
				row('Album', t.albumName),
				row('Track', t.trackNumber != null ? `${t.discNumber ?? 1}-${t.trackNumber}` : null),
				row('Duration', formatDuration(t.duration)),
				row('Year', t.year)
			];
			if (q) {
				rows.push(
					row('Codec', q.codec?.toUpperCase()),
					row('Bitrate', q.bitrate != null ? formatBitrate(q.bitrate) : null),
					row('Bit Depth', formatBitDepth(q.bitDepth)),
					row('Sample Rate', formatSampleRate(q.sampleRate)),
					row('Channels', formatChannels(q.channels))
				);
			}
			return rows;
		}
		if (item.type === 'radio') {
			return [
				row('Station', item.data.name),
				row('Type', 'Internet Radio'),
				row('Codec', item.data.codec?.toUpperCase()),
				row('Bitrate', item.data.bitrate != null ? formatBitrate(item.data.bitrate) : null)
			];
		}
		if (item.type === 'podcast') {
			return [
				row('Episode', item.data.title),
				row('Type', 'Podcast'),
				row('Duration', formatDuration(item.data.duration_secs * 1000))
			];
		}
		return [];
	});

	let normRows = $derived.by(() => {
		if (!item || item.type !== 'track' || !item.data.quality) return [];
		const q = item.data.quality;
		return [
			row('Track Gain', formatGainDb(q.gain)),
			row('Album Gain', formatGainDb(q.albumGain)),
			row('Peak', q.peak != null ? q.peak.toFixed(3) : null),
			row('Loudness', formatLufs(q.loudness))
		].filter((r) => r.value !== '—');
	});

	let crossfadeRows = $derived.by(() => {
		if (!analysis) return [];
		return [
			row('BPM', analysis.bpm > 0 ? analysis.bpm.toFixed(1) : null),
			row('Audio Start', `${(analysis.audioStartMs / 1000).toFixed(2)}s`),
			row('Audio End', `${(analysis.audioEndMs / 1000).toFixed(2)}s`),
			row('Outro Start', `${(analysis.outroStartMs / 1000).toFixed(2)}s`),
			row('Intro End', `${(analysis.introEndMs / 1000).toFixed(2)}s`),
			row('Median Energy', analysis.medianEnergy.toFixed(4))
		];
	});

	let engineRows = $derived.by(() => {
		if (!debugInfo) return [];
		return [
			row('Context', debugInfo.contextState),
			row('Sample Rate', debugInfo.contextSampleRate != null ? `${debugInfo.contextSampleRate} Hz` : null),
			row('Normalization', debugInfo.normalizationEnabled ? 'On' : 'Off'),
			row('Crossfade', debugInfo.crossfadeWindowMs > 0 ? `${debugInfo.crossfadeWindowMs}ms` : 'Off'),
			row('Smart XF', debugInfo.smartCrossfadeEnabled ? 'On' : 'Off'),
			row('Same Album XF', debugInfo.sameAlbumCrossfade ? 'On' : 'Off'),
			row('Is Crossfading', debugInfo.isCrossfading ? 'Yes' : 'No'),
			row('EQ', debugInfo.eqEnabled ? 'On' : 'Off'),
			row('Volume', `${(debugInfo.volume * 100).toFixed(0)}%`),
			row('Visualizer', debugInfo.visEnabled ? 'On' : 'Off'),
			row('Analysis Cache', `${debugInfo.analysisCacheSize} tracks`),
			row('Analysis Queue', `${debugInfo.analysisQueueLength}`),
			row('Play Generation', `${debugInfo.playGeneration}`)
		];
	});

	let deckRows = $derived.by(() => {
		if (!debugInfo?.activeDeck) return [];
		const d = debugInfo.activeDeck;
		return [
			row('Deck Track', d.trackId),
			row('Position', `${d.currentTimeSec.toFixed(1)}s`),
			row('Norm Gain', d.normGainValue.toFixed(4)),
			row('Paused', d.paused ? 'Yes' : 'No'),
			row('Ready State', `${d.readyState}`),
			row('Network', `${d.networkState}`)
		];
	});
</script>

<FloatingCard bind:open position="above" align="start">
	{#snippet trigger()}
		{#if badgeText}
			<button
				type="button"
				class="rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums transition-colors hover:border-accent/50 hover:text-accent {open
					? 'border-accent/30 text-accent'
					: 'border-border text-text-secondary'}"
			>
				{badgeText}
			</button>
		{:else}
			<button
				type="button"
				class="flex items-center justify-center text-text-muted transition-colors hover:text-text-secondary"
			>
				<Info size={14} />
			</button>
		{/if}
	{/snippet}
	{#snippet children()}
		<div class="flex gap-0 p-4" style="max-height: 70vh; overflow-y: auto;">
			<!-- Column 1: Track info + normalization -->
			<div class="min-w-[200px] max-w-[240px]">
				<h3 class="mb-2 text-xs font-bold text-text-primary">Track Info</h3>
				<div class="space-y-1">
					{#each trackRows as { label, value }}
						<div class="flex justify-between gap-3 text-[11px]">
							<span class="shrink-0 text-text-muted">{label}</span>
							<span class="truncate text-right text-text-secondary">{value}</span>
						</div>
					{/each}
				</div>

				{#if normRows.length > 0}
					<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">Normalization</h3>
					<div class="space-y-1">
						{#each normRows as { label, value }}
							<div class="flex justify-between gap-3 text-[11px]">
								<span class="shrink-0 text-text-muted">{label}</span>
								<span class="truncate text-right text-text-secondary">{value}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Column 2: Crossfade analysis (when applicable) -->
			{#if hasCrossfadeAnalysis}
				<div class="ml-4 min-w-[180px] max-w-[220px] border-l border-border pl-4">
					<h3 class="mb-2 text-xs font-bold text-text-primary">Crossfade Analysis</h3>
					<div class="space-y-1">
						{#each crossfadeRows as { label, value }}
							<div class="flex justify-between gap-3 text-[11px]">
								<span class="shrink-0 text-text-muted">{label}</span>
								<span class="truncate text-right text-text-secondary">{value}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Column 3: Engine debug (when debug enabled) -->
			{#if debugEnabled && debugInfo}
				<div class="ml-4 min-w-[200px] max-w-[260px] border-l border-border pl-4">
					<h3 class="mb-2 text-xs font-bold text-text-primary">Engine</h3>
					<div class="space-y-1">
						{#each engineRows as { label, value }}
							<div class="flex justify-between gap-3 text-[11px]">
								<span class="shrink-0 text-text-muted">{label}</span>
								<span class="truncate text-right font-mono text-text-secondary">{value}</span>
							</div>
						{/each}
					</div>

					{#if deckRows.length > 0}
						<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">Active Deck</h3>
						<div class="space-y-1">
							{#each deckRows as { label, value }}
								<div class="flex justify-between gap-3 text-[11px]">
									<span class="shrink-0 text-text-muted">{label}</span>
									<span class="truncate text-right font-mono text-text-secondary">{value}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if item?.type === 'track' && Object.keys(item.data.extra).length > 0}
						<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">Backend Extra</h3>
						<div class="space-y-1">
							{#each Object.entries(item.data.extra) as [key, value]}
								<div class="flex justify-between gap-3 text-[11px]">
									<span class="shrink-0 text-text-muted">{key}</span>
									<span class="max-w-[140px] truncate text-right font-mono text-text-secondary">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
								</div>
							{/each}
						</div>
					{/if}

					<button
						type="button"
						class="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-border px-2 py-1.5 text-[11px] text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-secondary"
						onclick={copyJson}
					>
						{#if copied}
							<Check size={12} class="text-green-400" />
							<span class="text-green-400">Copied!</span>
						{:else}
							<Copy size={12} />
							<span>Copy JSON</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<!-- Debug toggle footer -->
		<div class="flex items-center justify-end border-t border-border px-4 py-2">
			<button
				type="button"
				class="rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors {debugEnabled
					? 'bg-accent text-bg-base'
					: 'bg-bg-highlight text-text-muted hover:text-text-secondary'}"
				onclick={() => setDebugEnabled(!debugEnabled)}
			>
				Debug {debugEnabled ? 'On' : 'Off'}
			</button>
		</div>
	{/snippet}
</FloatingCard>
