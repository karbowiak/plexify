<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import PlayerBar from '$lib/components/layout/PlayerBar.svelte';
	import GlobalHotkeys from '$lib/components/layout/GlobalHotkeys.svelte';
	import SidePanel from '$lib/components/layout/SidePanel.svelte';
	import { getShowCreatePlaylist } from '$lib/stores/uiEphemeral.svelte';
	import CreatePlaylistModal from '$lib/components/ui/CreatePlaylistModal.svelte';
	import { applyTheme } from '$lib/stores/applyTheme.svelte';
	import { scrollMemory, trackPath } from '$lib/actions/scrollMemory';
	import { page } from '$app/state';
	import { getAppearance, getGeneral, getSidePanel, initFromServer } from '$lib/stores/configStore.svelte';
	import { restoreBackends, initCapabilitiesFromSSR } from '$lib/stores/backendStore.svelte';
	import { initMediaSession, destroyMediaSession } from '$lib/stores/mediaSession.svelte';
	import { initEventStore, destroyEventStore } from '$lib/stores/eventStore.svelte';
	import { startDiscoveryScheduler, stopDiscoveryScheduler } from '$lib/stores/discoveryScheduler.svelte';
	import { setLocale, isLocale } from '$lib/paraglide/runtime.js';
	import { computeThemeProperties } from '$lib/theme';
	import { onMount } from 'svelte';

	let compact = $derived(getAppearance().compactMode);

	let { data, children } = $props();

	// Seed stores from server-provided config — runs during SSR + client init
	initFromServer(data.config);
	initCapabilitiesFromSSR(data.backendCaps);

	// Generate SSR theme CSS from server-provided config
	let themeCSS = $derived.by(() => {
		if (!data.config) return '';
		const { properties } = computeThemeProperties(data.config.appearance);
		return ':root{' + Object.entries(properties).map(([k, v]) => `${k}:${v}`).join(';') + '}';
	});

	$effect(() => {
		applyTheme();
	});

	onMount(() => {
		const savedLang = getGeneral().language;
		if (savedLang && isLocale(savedLang)) {
			setLocale(savedLang);
		}
		restoreBackends();
		initMediaSession();
		initEventStore().then(() => startDiscoveryScheduler());
		return () => {
			stopDiscoveryScheduler();
			destroyMediaSession();
			destroyEventStore();
		};
	});

	$effect(() => {
		trackPath(page.url.pathname);
	});

	let activePanel = $derived(getSidePanel());
	let showCreatePlaylist = $derived(getShowCreatePlaylist());
	let isSettings = $derived(page.url.pathname.startsWith('/settings'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if themeCSS}
		{@html `<style id="ssr-theme">${themeCSS}</style>`}
	{/if}
</svelte:head>

<div class="flex h-screen flex-col bg-bg-base">
	<div class="flex min-h-0 flex-1">
		<Sidebar />
		<div class="relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200">
			<div class="absolute inset-x-0 top-0 z-30">
				<TopBar />
			</div>
			<main use:scrollMemory={'main'} class="relative flex min-h-0 flex-1 flex-col bg-bg-surface pt-(--spacing-topbar) {isSettings ? '' : compact ? 'overflow-y-auto pr-4 pb-4 pl-4' : 'overflow-y-auto pr-6 pb-6 pl-6'}">
				<div class="{isSettings ? 'flex min-h-0 flex-1' : 'relative'}">
					{@render children()}
				</div>
			</main>
			<div class="pointer-events-none absolute inset-x-0 top-0 z-20 h-(--spacing-topbar) bg-bg-surface"></div>
		</div>
		{#if activePanel}
			<SidePanel />
		{/if}
	</div>
	<PlayerBar />
</div>

<GlobalHotkeys />

{#if showCreatePlaylist}
	<CreatePlaylistModal />
{/if}
