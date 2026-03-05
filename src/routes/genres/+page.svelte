<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<section>
	<h1 class="mb-6 text-3xl font-extrabold">{m.genres_title()}</h1>

	{#if data.genres.length === 0}
		<p class="py-12 text-center text-text-muted">{m.genres_empty()}</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each data.genres as g}
				<a
					href="/genres/{encodeURIComponent(g.tag)}"
					class="group flex items-center justify-center rounded-lg bg-bg-elevated p-6 text-center font-semibold transition-all hover:bg-bg-hover hover:shadow-lg hover:shadow-black/20"
				>
					<span class="text-sm">{g.tag}</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
