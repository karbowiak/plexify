import { db } from './index';
import { userConfig } from './schema';
import { defaults, type AppConfig } from '$lib/configTypes';
import { eq } from 'drizzle-orm';

const CONFIG_SECTIONS = [
	'general',
	'backends',
	'metadata',
	'playback',
	'appearance',
	'caches',
	'ui',
	'visualizer'
] as const;

type ConfigSection = (typeof CONFIG_SECTIONS)[number];

function isConfigSection(key: string): key is ConfigSection {
	return CONFIG_SECTIONS.includes(key as ConfigSection);
}

export function getFullConfig(userId: number): AppConfig {
	const row = db.select().from(userConfig).where(eq(userConfig.userId, userId)).get();
	if (!row) return structuredClone(defaults);

	return {
		general: { ...defaults.general, ...(row.general as object) },
		backends: { ...defaults.backends, ...(row.backends as object) },
		metadata: { ...defaults.metadata, ...(row.metadata as object) },
		playback: {
			...defaults.playback,
			...(row.playback as object),
			volume: {
				...defaults.playback.volume,
				...((row.playback as Record<string, unknown>)?.volume as object)
			},
			eq: { ...defaults.playback.eq, ...((row.playback as Record<string, unknown>)?.eq as object) }
		},
		appearance: { ...defaults.appearance, ...(row.appearance as object) },
		caches: { ...defaults.caches, ...(row.caches as object) },
		ui: { ...defaults.ui, ...(row.ui as object) },
		visualizer: { ...defaults.visualizer, ...(row.visualizer as object) }
	};
}

export function updateSection(userId: number, section: string, value: unknown): void {
	if (!isConfigSection(section)) throw new Error(`Invalid config section: ${section}`);

	db.update(userConfig)
		.set({
			[section]: value as Record<string, unknown>,
			updatedAt: new Date()
		})
		.where(eq(userConfig.userId, userId))
		.run();
}
