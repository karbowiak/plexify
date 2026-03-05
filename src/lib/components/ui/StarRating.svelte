<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Star } from 'lucide-svelte';

	interface Props {
		rating?: number;
		max?: number;
		size?: number;
		interactive?: boolean;
		onrate?: (rating: number) => void;
		class?: string;
	}

	let {
		rating = 0,
		max = 5,
		size = 12,
		interactive = true,
		onrate,
		class: className = ''
	}: Props = $props();

	let hovered = $state(-1);

	function handleClick(index: number) {
		if (!interactive) return;
		const newRating = index + 1 === rating ? 0 : index + 1;
		onrate?.(newRating);
	}
</script>

<div
	class="flex gap-0.5 {className}"
	onmouseleave={() => (hovered = -1)}
	role={interactive ? 'radiogroup' : 'img'}
	aria-label={m.aria_rating({ rating, max })}
>
	{#each Array(max) as _, i}
		{@const filled = hovered >= 0 ? i <= hovered : i < rating}
		<button
			type="button"
			class="transition-colors {interactive ? 'cursor-pointer' : 'cursor-default'} {filled
				? 'text-accent fill-accent'
				: 'text-text-muted hover:text-accent/60'}"
			onclick={() => handleClick(i)}
			onmouseenter={() => interactive && (hovered = i)}
			aria-label={m.aria_star_rating_value({ count: i + 1 })}
			disabled={!interactive}
		>
			<Star {size} class={filled ? 'fill-current' : ''} />
		</button>
	{/each}
</div>
