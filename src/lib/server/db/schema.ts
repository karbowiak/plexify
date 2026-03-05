import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	displayName: text('display_name'),
	passwordHash: text('password_hash'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const userConfig = sqliteTable('user_config', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id)
		.unique(),
	general: text('general', { mode: 'json' }).notNull(),
	backends: text('backends', { mode: 'json' }).notNull(),
	metadata: text('metadata', { mode: 'json' }).notNull(),
	playback: text('playback', { mode: 'json' }).notNull(),
	appearance: text('appearance', { mode: 'json' }).notNull(),
	caches: text('caches', { mode: 'json' }).notNull(),
	ui: text('ui', { mode: 'json' }).notNull(),
	visualizer: text('visualizer', { mode: 'json' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
