import { db } from './index';
import { users, userConfig } from './schema';
import { defaults } from '$lib/configTypes';
import { eq } from 'drizzle-orm';

export interface DefaultUser {
	id: number;
	username: string;
	displayName: string | null;
}

let cached: DefaultUser | null = null;

export function ensureDefaultUser(): DefaultUser {
	if (cached) return cached;

	const existing = db.select().from(users).where(eq(users.username, 'default')).get();
	if (existing) {
		cached = { id: existing.id, username: existing.username, displayName: existing.displayName };
		return cached;
	}

	const result = db
		.insert(users)
		.values({ username: 'default', displayName: 'Default User' })
		.returning()
		.get();

	db.insert(userConfig)
		.values({
			userId: result.id,
			general: defaults.general as unknown as Record<string, unknown>,
			backends: defaults.backends as unknown as Record<string, unknown>,
			metadata: defaults.metadata as unknown as Record<string, unknown>,
			playback: defaults.playback as unknown as Record<string, unknown>,
			appearance: defaults.appearance as unknown as Record<string, unknown>,
			caches: defaults.caches as unknown as Record<string, unknown>,
			ui: defaults.ui as unknown as Record<string, unknown>,
			visualizer: defaults.visualizer as unknown as Record<string, unknown>
		})
		.run();

	cached = { id: result.id, username: result.username, displayName: result.displayName };
	return cached;
}
