<script lang="ts">
	import { Image, Database, ChevronRight, Tags, Cloud, AudioWaveform, Music } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();

	interface CacheProviderInfo {
		id: string;
		name: string;
		description: string;
		icon: string;
		totalSizeBytes?: number;
		entryCount?: number;
	}

	const iconMap: Record<string, any> = {
		image: Image,
		database: Database,
		tags: Tags,
		cloud: Cloud,
		'audio-waveform': AudioWaveform,
		music: Music
	};

	let providers = $derived<CacheProviderInfo[]>([
		{
			id: 'image',
			name: m.cache_image_name(),
			description: m.cache_image_overview_desc(),
			icon: 'image',
			totalSizeBytes: data.providerStats['image']?.totalSizeBytes,
			entryCount: data.providerStats['image']?.entryCount
		},
		{
			id: 'media',
			name: m.cache_media_name(),
			description: m.cache_media_overview_desc(),
			icon: 'music',
			totalSizeBytes: data.providerStats['media']?.totalSizeBytes,
			entryCount: data.providerStats['media']?.entryCount
		},
		{
			id: 'metadata',
			name: m.cache_metadata_name(),
			description: m.cache_metadata_overview_desc(),
			icon: 'tags',
			totalSizeBytes: data.providerStats['metadata']?.totalSizeBytes,
			entryCount: data.providerStats['metadata']?.entryCount
		},
		{
			id: 'audio-analysis',
			name: m.cache_audio_analysis_name(),
			description: m.cache_audio_analysis_overview_desc(),
			icon: 'audio-waveform',
			totalSizeBytes: data.providerStats['audio-analysis']?.totalSizeBytes,
			entryCount: data.providerStats['audio-analysis']?.entryCount
		},
		{
			id: 'api',
			name: m.cache_api_name(),
			description: m.cache_api_overview_desc(),
			icon: 'cloud',
			totalSizeBytes: data.providerStats['api']?.totalSizeBytes,
			entryCount: data.providerStats['api']?.entryCount
		}
	]);

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">{m.cache_title()}</h1>
	<p class="text-sm text-text-secondary">{m.cache_desc()}</p>

	<div class="space-y-3">
		{#each providers as provider}
			{@const IconComponent = iconMap[provider.icon] ?? Database}
			<a
				href="/settings/cache/{provider.id}"
				class="group flex items-center gap-4 rounded-xl border border-border bg-bg-elevated p-5 transition-colors hover:border-accent/30 hover:bg-bg-elevated/80"
			>
				<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
					<IconComponent size={20} class="text-accent" />
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<p class="text-sm font-semibold text-text-primary">{provider.name}</p>
						{#if provider.totalSizeBytes !== undefined}
							<span class="rounded-full bg-overlay-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">
								{formatBytes(provider.totalSizeBytes)}
							</span>
						{/if}
						{#if provider.entryCount !== undefined}
							<span class="rounded-full bg-overlay-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">
								{m.cache_entries({ count: provider.entryCount.toLocaleString() })}
							</span>
						{/if}
					</div>
					<p class="mt-0.5 text-xs text-text-secondary">{provider.description}</p>
				</div>

				<ChevronRight size={16} class="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
			</a>
		{/each}
	</div>
</div>
