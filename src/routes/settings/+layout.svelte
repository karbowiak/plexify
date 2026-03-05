<script lang="ts">
	import { page } from '$app/state';
	import { scrollMemory } from '$lib/actions/scrollMemory';
	import { getAll } from '$lib/backends/registry';
	import { Cog, Server, Headphones, Palette, Tags, Info, Database } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { children } = $props();

	interface MenuItem {
		label: () => string;
		href: string;
		icon: any;
		children?: { label: () => string; href: string }[];
	}

	const menuItems: MenuItem[] = $derived([
		{ label: () => m.settings_general(), href: '/settings/general', icon: Cog },
		{
			label: () => m.settings_backends(),
			href: '/settings/backends',
			icon: Server,
			children: getAll().map((b) => ({
				label: () => b.metadata.name.replace(' Backend', ''),
				href: `/settings/backends/${b.id}`
			}))
		},
		{ label: () => m.settings_metadata(), href: '/settings/metadata', icon: Tags },
		{ label: () => m.settings_playback(), href: '/settings/playback', icon: Headphones },
		{ label: () => m.settings_appearance(), href: '/settings/appearance', icon: Palette },
		{
			label: () => m.settings_cache(),
			href: '/settings/cache',
			icon: Database,
			children: [
				{ label: () => m.settings_image(), href: '/settings/cache/image' },
				{ label: () => m.settings_media(), href: '/settings/cache/media' },
				{ label: () => m.settings_metadata(), href: '/settings/cache/metadata' },
				{ label: () => m.settings_audio_analysis(), href: '/settings/cache/audio-analysis' },
				{ label: () => m.settings_api(), href: '/settings/cache/api' }
			]
		}
	]);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<div class="flex h-full w-full">
	<!-- Settings Sidebar -->
	<nav class="flex w-[180px] shrink-0 flex-col pt-6 pl-2">
		<p class="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
			{m.settings_title()}
		</p>

		<div class="flex flex-1 flex-col gap-0.5">
			{#each menuItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors {isActive(
						item.href
					)
						? 'text-text-primary border-l-2 border-accent'
						: 'text-text-secondary hover:bg-accent-tint-hover hover:text-text-primary border-l-2 border-transparent'}"
				style={isActive(item.href) ? `background: var(--color-accent-tint)` : undefined}
				>
					<item.icon
						size={18}
						strokeWidth={isActive(item.href) ? 2.5 : 2}
						class={isActive(item.href) ? 'text-accent' : ''}
					/>
					<span>{item.label()}</span>
				</a>

				{#if item.children && isActive(item.href)}
					{#each item.children as child}
						<a
							href={child.href}
							class="ml-7 rounded-md px-3 py-1.5 text-xs font-medium transition-colors {isActive(
								child.href
							)
								? 'text-text-primary'
								: 'text-text-secondary hover:text-text-primary'}"
						>
							{child.label()}
						</a>
					{/each}
				{/if}
			{/each}

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- About -->
			<a
				href="/settings/about"
				class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors {isActive(
					'/settings/about'
				)
					? 'text-text-primary border-l-2 border-accent'
					: 'text-text-secondary hover:bg-accent-tint-hover hover:text-text-primary border-l-2 border-transparent'}"
				style={isActive('/settings/about') ? `background: var(--color-accent-tint)` : undefined}
			>
				<Info
					size={18}
					strokeWidth={isActive('/settings/about') ? 2.5 : 2}
					class={isActive('/settings/about') ? 'text-accent' : ''}
				/>
				<span>{m.settings_about()}</span>
			</a>
		</div>
	</nav>

	<!-- Settings Content -->
	<div class="flex-1 overflow-y-auto p-8" use:scrollMemory={'settings'}>
		<div>
			{@render children()}
		</div>
	</div>
</div>
