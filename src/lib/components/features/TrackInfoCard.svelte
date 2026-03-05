<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
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
		if (item.type === 'radio') return m.track_info_badge_radio();
		if (item.type === 'podcast') return m.track_info_badge_podcast();
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
				row(m.track_info_label_title(), t.title),
				row(m.track_info_label_artist(), t.artistName),
				row(m.track_info_label_album(), t.albumName),
				row(m.track_info_label_track(), t.trackNumber != null ? `${t.discNumber ?? 1}-${t.trackNumber}` : null),
				row(m.track_info_label_duration(), formatDuration(t.duration)),
				row(m.track_info_year(), t.year)
			];
			if (q) {
				rows.push(
					row(m.track_info_label_codec(), q.codec?.toUpperCase()),
					row(m.track_info_label_bitrate(), q.bitrate != null ? formatBitrate(q.bitrate) : null),
					row(m.track_info_bit_depth(), formatBitDepth(q.bitDepth)),
					row(m.track_info_label_sample_rate(), formatSampleRate(q.sampleRate)),
					row(m.track_info_label_channels(), formatChannels(q.channels))
				);
			}
			return rows;
		}
		if (item.type === 'radio') {
			return [
				row(m.track_info_station(), item.data.name),
				row(m.track_info_label_type(), m.track_info_internet_radio()),
				row(m.track_info_label_codec(), item.data.codec?.toUpperCase()),
				row(m.track_info_label_bitrate(), item.data.bitrate != null ? formatBitrate(item.data.bitrate) : null)
			];
		}
		if (item.type === 'podcast') {
			return [
				row(m.track_info_episode(), item.data.title),
				row(m.track_info_label_type(), m.track_info_podcast()),
				row(m.track_info_label_duration(), formatDuration(item.data.duration_secs * 1000))
			];
		}
		return [];
	});

	let normRows = $derived.by(() => {
		if (!item || item.type !== 'track' || !item.data.quality) return [];
		const q = item.data.quality;
		return [
			row(m.track_info_label_gain(), formatGainDb(q.gain)),
			row(m.track_info_label_gain(), formatGainDb(q.albumGain)),
			row(m.track_info_label_peak(), q.peak != null ? q.peak.toFixed(3) : null),
			row(m.track_info_label_loudness(), formatLufs(q.loudness))
		].filter((r) => r.value !== '—');
	});

	let crossfadeRows = $derived.by(() => {
		if (!analysis) return [];
		return [
			row(m.track_info_bpm(), analysis.bpm > 0 ? analysis.bpm.toFixed(1) : null),
			row(m.track_info_audio_start(), `${(analysis.audioStartMs / 1000).toFixed(2)}s`),
			row(m.track_info_audio_end(), `${(analysis.audioEndMs / 1000).toFixed(2)}s`),
			row(m.track_info_outro_start(), `${(analysis.outroStartMs / 1000).toFixed(2)}s`),
			row(m.track_info_intro_end(), `${(analysis.introEndMs / 1000).toFixed(2)}s`),
			row(m.track_info_median_energy(), analysis.medianEnergy.toFixed(4))
		];
	});

	let engineRows = $derived.by(() => {
		if (!debugInfo) return [];
		return [
			row(m.track_info_context(), debugInfo.contextState),
			row(m.track_info_label_sample_rate(), debugInfo.contextSampleRate != null ? `${debugInfo.contextSampleRate} Hz` : null),
			row(m.track_info_normalization(), debugInfo.normalizationEnabled ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_crossfade(), debugInfo.crossfadeWindowMs > 0 ? `${debugInfo.crossfadeWindowMs}ms` : m.track_info_no()),
			row(m.track_info_smart_xf(), debugInfo.smartCrossfadeEnabled ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_same_album_xf(), debugInfo.sameAlbumCrossfade ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_label_crossfading(), debugInfo.isCrossfading ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_eq(), debugInfo.eqEnabled ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_volume(), `${(debugInfo.volume * 100).toFixed(0)}%`),
			row(m.track_info_visualizer(), debugInfo.visEnabled ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_analysis_cache(), `${debugInfo.analysisCacheSize} ${m.track_info_tracks()}`),
			row(m.track_info_analysis_queue(), `${debugInfo.analysisQueueLength}`),
			row(m.track_info_play_generation(), `${debugInfo.playGeneration}`)
		];
	});

	let deckRows = $derived.by(() => {
		if (!debugInfo?.activeDeck) return [];
		const d = debugInfo.activeDeck;
		return [
			row(m.track_info_label_deck(), d.trackId),
			row(m.track_info_label_position(), `${d.currentTimeSec.toFixed(1)}s`),
			row(m.track_info_norm_gain(), d.normGainValue.toFixed(4)),
			row(m.track_info_paused(), d.paused ? m.track_info_yes() : m.track_info_no()),
			row(m.track_info_ready_state(), `${d.readyState}`),
			row(m.track_info_network(), `${d.networkState}`)
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
				<h3 class="mb-2 text-xs font-bold text-text-primary">{m.track_info_title()}</h3>
				<div class="space-y-1">
					{#each trackRows as { label, value }}
						<div class="flex justify-between gap-3 text-[11px]">
							<span class="shrink-0 text-text-muted">{label}</span>
							<span class="truncate text-right text-text-secondary">{value}</span>
						</div>
					{/each}
				</div>

				{#if normRows.length > 0}
					<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">{m.track_info_normalization()}</h3>
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
					<h3 class="mb-2 text-xs font-bold text-text-primary">{m.track_info_crossfade_analysis()}</h3>
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
					<h3 class="mb-2 text-xs font-bold text-text-primary">{m.track_info_engine()}</h3>
					<div class="space-y-1">
						{#each engineRows as { label, value }}
							<div class="flex justify-between gap-3 text-[11px]">
								<span class="shrink-0 text-text-muted">{label}</span>
								<span class="truncate text-right font-mono text-text-secondary">{value}</span>
							</div>
						{/each}
					</div>

					{#if deckRows.length > 0}
						<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">{m.track_info_active_deck()}</h3>
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
						<h3 class="mb-2 mt-4 text-xs font-bold text-text-primary">{m.track_info_backend_extra()}</h3>
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
							<span class="text-green-400">{m.action_copied()}</span>
						{:else}
							<Copy size={12} />
							<span>{m.action_copy_json()}</span>
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
				{debugEnabled ? m.track_info_debug_on() : m.track_info_debug_off()}
			</button>
		</div>
	{/snippet}
</FloatingCard>
