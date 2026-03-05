<script lang="ts">
	import { Disc3, Heart } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	const techStack = [
		{ name: 'SvelteKit', color: 'text-orange-400' },
		{ name: 'Svelte 5', color: 'text-orange-400' },
		{ name: 'TypeScript', color: 'text-blue-400' },
		{ name: 'Tailwind CSS v4', color: 'text-cyan-400' },
		{ name: 'Lucide Icons', color: 'text-text-secondary' }
	];
</script>

<div class="flex flex-col items-center gap-8 py-8">
	<!-- Hero: Pulsing rings + spinning disc -->
	<div class="relative flex h-40 w-40 items-center justify-center">
		<!-- Concentric rings -->
		<div
			class="ring-pulse absolute inset-0 rounded-full border border-accent/20"
		></div>
		<div
			class="ring-pulse ring-delay-1 absolute inset-3 rounded-full border border-accent/15"
		></div>
		<div
			class="ring-pulse ring-delay-2 absolute inset-6 rounded-full border border-accent/10"
		></div>

		<!-- Center disc -->
		<div
			class="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 shadow-[0_0_30px_var(--color-accent)/0.15]"
		>
			<Disc3 size={40} class="icon-spin text-accent" />
		</div>
	</div>

	<!-- Branding -->
	<div class="flex flex-col items-center gap-1.5">
		<h1 class="text-4xl font-bold text-text-primary">{m.about_title()}</h1>
		<p class="text-lg text-text-muted">響</p>
		<p class="text-xs font-semibold uppercase tracking-widest text-accent/80">
			{m.about_tagline()}
		</p>
	</div>

	<!-- Version pill -->
	<span
		class="rounded-full border border-border bg-overlay px-4 py-1 text-xs font-medium text-text-secondary"
	>
		{m.about_version()}
	</span>

	<!-- Divider -->
	<div class="h-px w-full max-w-md bg-border"></div>

	<!-- Description card -->
	<div
		class="w-full max-w-md rounded-xl border border-border bg-bg-elevated p-6 text-center"
	>
		<p class="text-sm text-text-secondary">{m.about_desc()}</p>
		<p class="mt-3 text-sm italic text-text-muted">{m.about_meaning()}</p>
	</div>

	<!-- Tech stack -->
	<div class="flex flex-col items-center gap-3">
		<h3 class="text-sm font-semibold text-accent">{m.about_built_with()}</h3>
		<div class="flex flex-wrap justify-center gap-2">
			{#each techStack as tech}
				<span
					class="rounded-full border border-border bg-overlay px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent/20 hover:bg-accent-tint"
				>
					<span class={tech.color}>{tech.name}</span>
				</span>
			{/each}
		</div>
	</div>

	<!-- Footer -->
	<p class="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
		<Heart size={12} class="text-accent/60" />
		{m.about_made_with_love()}
	</p>
</div>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes ringPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.3;
		}
		50% {
			transform: scale(1.05);
			opacity: 1;
		}
	}

	:global(.icon-spin) {
		animation: spin 8s linear infinite;
	}

	.ring-pulse {
		animation: ringPulse 3s ease-in-out infinite;
	}

	.ring-delay-1 {
		animation-delay: 0.6s;
	}

	.ring-delay-2 {
		animation-delay: 1.2s;
	}
</style>
