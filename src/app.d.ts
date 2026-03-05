import type { AppConfig } from '$lib/configTypes';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: number; username: string; displayName: string | null };
			config: AppConfig;
			backendCaps: string[];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
