<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		context: 'player' | 'visualizer';
		onclose: () => void;
	}

	let { context, onclose }: Props = $props();

	interface Hotkey {
		key: string;
		action: () => string;
	}

	interface HotkeyGroup {
		title: () => string;
		hotkeys: Hotkey[];
	}

	const globalGroup: HotkeyGroup = {
		title: () => m.hotkey_group_playback(),
		hotkeys: [
			{ key: 'Space', action: () => m.hotkey_play_pause() },
			{ key: 'N', action: () => m.hotkey_next() },
			{ key: 'B', action: () => m.hotkey_previous() },
			{ key: '← / →', action: () => m.hotkey_seek_5() },
			{ key: 'Shift + ← / →', action: () => m.hotkey_seek_15() },
			{ key: '↑ / ↓', action: () => m.hotkey_volume() },
			{ key: 'M', action: () => m.hotkey_mute() },
			{ key: '?', action: () => m.hotkey_help() }
		]
	};

	const playerGroups: HotkeyGroup[] = [
		globalGroup,
		{
			title: () => m.hotkey_group_navigation(),
			hotkeys: [
				{ key: 'Cmd/Ctrl + F', action: () => m.hotkey_search() },
				{ key: 'S', action: () => m.hotkey_shuffle() },
				{ key: 'R', action: () => m.hotkey_repeat() },
				{ key: 'V', action: () => m.hotkey_open_visualizer() }
			]
		}
	];

	const visualizerGroups: HotkeyGroup[] = [
		globalGroup,
		{
			title: () => m.hotkey_group_visualizer(),
			hotkeys: [
				{ key: 'Escape', action: () => m.hotkey_close_visualizer() },
				{ key: 'F', action: () => m.hotkey_native_fullscreen() },
				{ key: '1–5', action: () => m.hotkey_switch_mode() },
				{ key: 'S', action: () => m.hotkey_shuffle() },
				{ key: 'R', action: () => m.hotkey_repeat() }
			]
		},
		{
			title: () => m.hotkey_group_milkdrop(),
			hotkeys: [
				{ key: '[ / ]', action: () => m.hotkey_prev_next_preset() },
				{ key: 'O', action: () => m.hotkey_browse_presets() },
				{ key: 'T', action: () => m.hotkey_random_preset() }
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

<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
	role="button"
	tabindex="-1"
	onclick={(e: MouseEvent) => { if (e.target === e.currentTarget) onclose(); }}
	onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
>
	<div class="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
		<h2 class="mb-5 text-lg font-bold text-white">{m.hotkey_title()}</h2>

		{#each groups as group, gi}
			{#if gi > 0}
				<div class="my-4 border-t border-white/10"></div>
			{/if}
			<h3 class="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/40">{group.title()}</h3>
			<div class="space-y-2">
				{#each group.hotkeys as hotkey}
					<div class="flex items-center justify-between">
						<span class="text-sm text-white/70">{hotkey.action()}</span>
						<kbd class="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60">
							{hotkey.key}
						</kbd>
					</div>
				{/each}
			</div>
		{/each}

		<div class="mt-5 text-center text-xs text-white/30">
			{m.hotkey_press_esc()}
		</div>
	</div>
</div>
