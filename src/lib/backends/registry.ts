import type { Backend } from './types';

const backends = new Map<string, Backend>();

export function register(backend: Backend) {
	backends.set(backend.id, backend);
}

export function get(id: string): Backend | undefined {
	return backends.get(id);
}

export function getAll(): Backend[] {
	return Array.from(backends.values());
}

// Auto-discover and register all plugins
interface PluginModule {
	createBackend: () => Backend;
}

const pluginModules = import.meta.glob<PluginModule>('../plugins/*/index.ts', { eager: true });

for (const [path, mod] of Object.entries(pluginModules)) {
	if (typeof mod.createBackend !== 'function') {
		throw new Error(
			`Plugin "${path}" does not export createBackend(). ` +
				`Each plugin index.ts must export: export function createBackend(): Backend`
		);
	}
	try {
		const backend = mod.createBackend();
		register(backend);
	} catch (err) {
		throw new Error(
			`Plugin "${path}" failed in createBackend(): ${err instanceof Error ? err.message : err}`
		);
	}
}
