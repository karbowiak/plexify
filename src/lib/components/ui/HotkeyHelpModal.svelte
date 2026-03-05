<script lang="ts">
	interface Props {
		context: 'player' | 'visualizer';
		onclose: () => void;
	}

	let { context, onclose }: Props = $props();

	interface Hotkey {
		key: string;
		action: string;
	}

	interface HotkeyGroup {
		title: string;
		hotkeys: Hotkey[];
	}

	const globalGroup: HotkeyGroup = {
		title: 'Playback',
		hotkeys: [
			{ key: 'Space', action: 'Play / pause' },
			{ key: 'N', action: 'Next track' },
			{ key: 'B', action: 'Previous track' },
			{ key: '← / →', action: 'Seek back / forward 5s' },
			{ key: 'Shift + ← / →', action: 'Seek back / forward 15s' },
			{ key: '↑ / ↓', action: 'Volume up / down' },
			{ key: 'M', action: 'Mute / unmute' },
			{ key: '?', action: 'Show hotkey help' }
		]
	};

	const playerGroups: HotkeyGroup[] = [
		globalGroup,
		{
			title: 'Navigation',
			hotkeys: [
				{ key: 'Cmd/Ctrl + F', action: 'Search' },
				{ key: 'S', action: 'Toggle shuffle' },
				{ key: 'R', action: 'Cycle repeat mode' },
				{ key: 'V', action: 'Open fullscreen visualizer' }
			]
		}
	];

	const visualizerGroups: HotkeyGroup[] = [
		globalGroup,
		{
			title: 'Visualizer',
			hotkeys: [
				{ key: 'Escape', action: 'Close visualizer / preset browser' },
				{ key: 'F', action: 'Toggle native fullscreen' },
				{ key: '1–5', action: 'Switch visualizer mode' },
				{ key: 'S', action: 'Toggle shuffle' },
				{ key: 'R', action: 'Cycle repeat mode' }
			]
		},
		{
			title: 'Milkdrop',
			hotkeys: [
				{ key: '[ / ]', action: 'Previous / next preset' },
				{ key: 'O', action: 'Browse presets' },
				{ key: 'T', action: 'Random preset' }
			]
		}
	];

	let groups = $derived(context === 'player' ? playerGroups : visualizerGroups);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
	onclick={(e: MouseEvent) => { if (e.target === e.currentTarget) onclose(); }}
>
	<div class="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
		<h2 class="mb-5 text-lg font-bold text-white">Keyboard Shortcuts</h2>

		{#each groups as group, gi}
			{#if gi > 0}
				<div class="my-4 border-t border-white/10"></div>
			{/if}
			<h3 class="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/40">{group.title}</h3>
			<div class="space-y-2">
				{#each group.hotkeys as hotkey}
					<div class="flex items-center justify-between">
						<span class="text-sm text-white/70">{hotkey.action}</span>
						<kbd class="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60">
							{hotkey.key}
						</kbd>
					</div>
				{/each}
			</div>
		{/each}

		<div class="mt-5 text-center text-xs text-white/30">
			Press <kbd class="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-white/40">Esc</kbd> to close
		</div>
	</div>
</div>
