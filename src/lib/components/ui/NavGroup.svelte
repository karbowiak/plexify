<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { ChevronRight } from 'lucide-svelte';
	import { getAppearance } from '$lib/stores/configStore.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		icon: any;
		label: string;
		active?: boolean;
		href?: string;
		expanded?: boolean;
		onToggle?: () => void;
		children?: Snippet;
	}

	let {
		icon: Icon,
		label,
		active = false,
		href = '#',
		expanded = false,
		onToggle,
		children
	}: Props = $props();

	let compact = $derived(getAppearance().compactMode);

	function handleChevronClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		onToggle?.();
	}
</script>

<div>
	<a
		{href}
		class="group flex items-center {compact ? 'gap-3' : 'gap-4'} px-4 {compact
			? 'py-1'
			: 'py-2'} text-sm font-medium transition-all {active
			? 'text-text-primary border-l-2 border-accent'
			: 'text-text-secondary hover:text-text-primary hover:bg-accent-tint-hover border-l-2 border-transparent'}"
		style={active ? `background: var(--color-accent-tint-subtle)` : undefined}
	>
		<Icon size={compact ? 18 : 22} strokeWidth={active ? 2.5 : 2} />
		<span class="flex-1">{label}</span>
		<button
			onclick={handleChevronClick}
			class="rounded p-1 transition-all hover:bg-overlay-medium {expanded ? 'opacity-70' : 'opacity-40 group-hover:opacity-70'}"
			aria-label={expanded ? m.aria_collapse_section({ label }) : m.aria_expand_section({ label })}
		>
			<ChevronRight
				size={14}
				class="transition-transform duration-200 {expanded ? 'rotate-90' : ''}"
			/>
		</button>
	</a>

	{#if expanded && children}
		<div transition:slide={{ duration: 150 }}>
			{@render children()}
		</div>
	{/if}
</div>
