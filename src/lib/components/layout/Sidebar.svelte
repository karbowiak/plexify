<script lang="ts">
	import {
		Home,
		Search,
		Library,
		Radio,
		Globe,
		Podcast,
		Plus,
		Tags,
		Heart,
		Users,
		Disc3,
		Star,
		Activity,
		Clock,
		MapPin,
		Music,
		AlertCircle,
		Sparkles
	} from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { fade } from 'svelte/transition';
	import NavItem from '$lib/components/ui/NavItem.svelte';
	import NavGroup from '$lib/components/ui/NavGroup.svelte';
	import SubNavItem from '$lib/components/ui/SubNavItem.svelte';
	import PlaylistItem from '$lib/components/ui/PlaylistItem.svelte';
	import { getArtExpanded, getAppearance } from '$lib/stores/configStore.svelte';
	import {
		toggleCreatePlaylist,
		getPlaylistVersion,
		isSubmenuPinned,
		toggleSubmenuPin
	} from '$lib/stores/uiEphemeral.svelte';
	import { hasCapability, getBackend } from '$lib/stores/backendStore.svelte';
	import { Capability } from '$lib/backends/types';
	import type { Playlist } from '$lib/backends/types';
	import { page } from '$app/state';

	let artExpanded = $derived(getArtExpanded());
	let compact = $derived(getAppearance().compactMode);

	let backendPlaylists = $state<Playlist[]>([]);

	$effect(() => {
		const _v = getPlaylistVersion();
		const b = getBackend();
		if (b && b.supports(Capability.Playlists) && b.getPlaylists) {
			b.getPlaylists().then((pls) => {
				backendPlaylists = pls;
			});
		} else {
			backendPlaylists = [];
		}
	});

	function isActive(path: string, exact = false): boolean {
		if (exact) return page.url.pathname === path;
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	// Derived: show submenu if pinned OR route is active
	let radioRouteActive = $derived(isActive('/radio'));
	let libraryRouteActive = $derived(isActive('/library') || isActive('/liked'));
	let activityRouteActive = $derived(isActive('/activity'));

	let radioExpanded = $derived(isSubmenuPinned('radio') || radioRouteActive);
	let libraryExpanded = $derived(isSubmenuPinned('library') || libraryRouteActive);
	let activityExpanded = $derived(isSubmenuPinned('activity') || activityRouteActive);
</script>

<aside class="flex h-full w-(--spacing-sidebar) shrink-0 flex-col bg-bg-base">
	<nav class="flex flex-col {compact ? 'pt-2 pb-1' : 'pt-4 pb-2'}">
		<NavItem icon={Home} label={m.nav_home()} href="/" active={isActive('/', true)} />
		{#if hasCapability(Capability.Search)}
			<NavItem icon={Search} label={m.nav_search()} href="/search" active={isActive('/search')} />
		{/if}

		{#if hasCapability(Capability.Artists) || hasCapability(Capability.Albums) || hasCapability(Capability.Tracks)}
			<NavGroup
				icon={Library}
				label={m.nav_library()}
				href="/library"
				active={isActive('/library') || isActive('/liked')}
				expanded={libraryExpanded}
				onToggle={() => toggleSubmenuPin('library')}
			>
				{#snippet children()}
					{#if hasCapability(Capability.Tracks)}
						<SubNavItem icon={Heart} label={m.nav_liked_songs()} href="/liked/songs" active={isActive('/liked/songs')} />
					{/if}
					{#if hasCapability(Capability.Artists)}
						<SubNavItem
							icon={Users}
							label={m.nav_liked_artists()}
							href="/liked/artists"
							active={isActive('/liked/artists')}
						/>
					{/if}
					{#if hasCapability(Capability.Albums)}
						<SubNavItem
							icon={Disc3}
							label={m.nav_liked_albums()}
							href="/liked/albums"
							active={isActive('/liked/albums')}
						/>
					{/if}
				{/snippet}
			</NavGroup>
		{/if}

		{#if hasCapability(Capability.Tags)}
			<NavItem icon={Tags} label={m.nav_genres()} href="/genres" active={isActive('/genres')} />
		{/if}
		<NavGroup
			icon={Activity}
			label={m.nav_activity()}
			href="/activity"
			active={isActive('/activity')}
			expanded={activityExpanded}
			onToggle={() => toggleSubmenuPin('activity')}
		>
			{#snippet children()}
				<SubNavItem icon={Clock} label={m.nav_recent()} href="/activity/recent" active={isActive('/activity/recent')} />
				<SubNavItem icon={AlertCircle} label={m.nav_system()} href="/activity/system" active={isActive('/activity/system')} />
				<SubNavItem icon={Sparkles} label={m.nav_discoveries()} href="/activity/discoveries" active={isActive('/activity/discoveries')} />
			{/snippet}
		</NavGroup>
		{#if hasCapability(Capability.Radio)}
			<NavItem icon={Radio} label={m.nav_stations()} href="/stations" active={isActive('/stations')} />
		{/if}
		{#if hasCapability(Capability.InternetRadio)}
			<NavGroup
				icon={Globe}
				label={m.nav_internet_radio()}
				href="/radio"
				active={isActive('/radio')}
				expanded={radioExpanded}
				onToggle={() => toggleSubmenuPin('radio')}
			>
				{#snippet children()}
					<SubNavItem
						icon={Star}
						label={m.nav_featured()}
						href="/radio"
						active={isActive('/radio', true)}
					/>
					<SubNavItem
						icon={Heart}
						label={m.nav_favorites()}
						href="/radio/favorites"
						active={isActive('/radio/favorites')}
					/>
					<SubNavItem
						icon={Clock}
						label={m.nav_recent()}
						href="/radio/recent"
						active={isActive('/radio/recent')}
					/>
					<SubNavItem
						icon={MapPin}
						label={m.nav_by_country()}
						href="/radio/country"
						active={isActive('/radio/country')}
					/>
					<SubNavItem
						icon={Music}
						label={m.nav_by_genre()}
						href="/radio/genre"
						active={isActive('/radio/genre')}
					/>
				{/snippet}
			</NavGroup>
		{/if}
		{#if hasCapability(Capability.Podcasts)}
			<NavItem icon={Podcast} label={m.nav_podcasts()} href="/podcasts" active={isActive('/podcasts')} />
		{/if}
	</nav>

	{#if hasCapability(Capability.Playlists)}
		<div class="mx-4 h-px bg-gradient-to-r from-transparent via-overlay-medium to-transparent"></div>

		<nav class="flex flex-col pt-2 pb-2">
			{#if hasCapability(Capability.EditPlaylists)}
				<NavItem icon={Plus} label={m.action_create_playlist()} onclick={() => toggleCreatePlaylist()} />
			{/if}
		</nav>

		<div class="mx-4 h-px bg-gradient-to-r from-transparent via-overlay-medium to-transparent"></div>

		<div
			class="flex min-h-0 flex-1 flex-col transition-[margin] duration-200 {artExpanded
				? 'mb-[calc(var(--spacing-sidebar)-var(--spacing-player))]'
				: ''}"
		>
			<div class="flex-1 overflow-y-auto pt-2 pb-2" transition:fade={{ duration: 150 }}>
				{#each backendPlaylists as pl}
					<PlaylistItem
						name={pl.title}
						href="/playlist/{pl.id}"
						active={page.url.pathname === `/playlist/${pl.id}`}
					/>
				{/each}
			</div>
		</div>
	{/if}
</aside>
