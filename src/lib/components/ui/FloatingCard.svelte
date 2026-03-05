<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		open?: boolean;
		position?: 'above' | 'below';
		align?: 'start' | 'end';
		trigger: Snippet;
		children: Snippet;
	}

	let { open = $bindable(false), position = 'below', align = 'end', trigger, children }: Props =
		$props();

	function clickOutside(node: HTMLElement) {
		function handleClick(e: MouseEvent) {
			if (!node.contains(e.target as Node) && open) {
				open = false;
			}
		}
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<div class="relative inline-block" use:clickOutside>
	<div role="button" tabindex="0" class="contents" onclick={() => (open = !open)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open = !open; } }}>
		{@render trigger()}
	</div>
	{#if open}
		<div
			class="absolute z-50 rounded-lg border border-border bg-bg-elevated shadow-2xl shadow-black/40 backdrop-blur-lg {position ===
			'above'
				? 'bottom-full mb-2'
				: 'top-full mt-2'} {align === 'end' ? 'right-0' : 'left-0'}"
			transition:fly={{ y: position === 'above' ? 8 : -8, duration: 150 }}
		>
			{@render children()}
		</div>
	{/if}
</div>
