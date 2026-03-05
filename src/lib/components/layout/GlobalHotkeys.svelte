<script lang="ts">
	import {
		togglePlayback,
		skipNext,
		skipPrevious,
		seekTo,
		getPosition,
		getDuration
	} from '$lib/stores/playerStore.svelte';
	import { getVolume, setVolume } from '$lib/stores/configStore.svelte';

	function isInput(e: KeyboardEvent): boolean {
		const tag = (e.target as HTMLElement)?.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isInput(e)) return;
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		switch (e.key) {
			case ' ':
				e.preventDefault();
				togglePlayback();
				break;
			case 'n':
			case 'N':
				e.preventDefault();
				skipNext();
				break;
			case 'b':
			case 'B':
				// In visualizer, B is handled there — but skipPrevious is global.
				// FullscreenVisualizer will stopPropagation for its own B (browse presets is now O).
				e.preventDefault();
				skipPrevious();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				seekTo(Math.max(0, getPosition() - (e.shiftKey ? 15000 : 5000)));
				break;
			case 'ArrowRight':
				e.preventDefault();
				seekTo(Math.min(getDuration(), getPosition() + (e.shiftKey ? 15000 : 5000)));
				break;
			case 'ArrowUp':
				e.preventDefault();
				{
					const vol = getVolume();
					setVolume({ level: Math.min(100, vol.level + 5), muted: false });
				}
				break;
			case 'ArrowDown':
				e.preventDefault();
				{
					const vol = getVolume();
					setVolume({ level: Math.max(0, vol.level - 5) });
				}
				break;
			case 'm':
			case 'M': {
				e.preventDefault();
				const vol = getVolume();
				if (vol.muted) {
					setVolume({ muted: false, level: vol.preMuteLevel || 70 });
				} else {
					setVolume({ muted: true, preMuteLevel: vol.level });
				}
				break;
			}
			default:
				return; // Don't prevent default for unhandled keys
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />
