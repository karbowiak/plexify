<script lang="ts">
	import { getAppearance } from '$lib/stores/configStore.svelte';
	interface Props {
		icon?: any;
		label: string;
		active?: boolean;
		href?: string;
	}

	let { icon: Icon, label, active = false, href = '#' }: Props = $props();

	let compact = $derived(getAppearance().compactMode);
</script>

<a
	{href}
	class="flex items-center gap-2.5 {compact ? 'py-0.5' : 'py-1'} pl-12 pr-4 text-[13px] font-medium transition-all {active
		? 'text-text-primary bg-accent-tint-subtle'
		: 'text-text-secondary hover:text-text-primary hover:bg-accent-tint-hover'}"
>
	{#if Icon}
		<Icon size={15} strokeWidth={active ? 2.5 : 2} class={active ? 'text-accent' : 'opacity-50'} />
	{/if}
	{label}
</a>
