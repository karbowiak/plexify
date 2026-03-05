import * as m from '$lib/paraglide/messages.js';

export const bandLabels = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'] as const;

export function getPresetName(key: string): string {
	const names: Record<string, () => string> = {
		flat: () => m.eq_preset_flat(),
		bass: () => m.eq_preset_bass_boost(),
		vocal: () => m.eq_preset_vocal(),
		treble: () => m.eq_preset_treble_boost(),
		rock: () => m.eq_preset_rock(),
		electronic: () => m.eq_preset_electronic()
	};
	return names[key]?.() ?? key;
}

export const presetNames: Record<string, string> = {
	flat: 'Flat',
	bass: 'Bass Boost',
	vocal: 'Vocal',
	treble: 'Treble Boost',
	rock: 'Rock',
	electronic: 'Electronic'
};

export const presets: Record<string, number[]> = {
	flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	bass: [6, 5, 4, 2, 0, 0, -1, -2, -2, -1],
	vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
	treble: [-2, -2, -1, 0, 0, 1, 2, 4, 5, 6],
	rock: [4, 3, 1, 0, -1, -1, 0, 2, 3, 4],
	electronic: [4, 3, 1, 0, -2, -1, 0, 2, 4, 5]
};
