import type { Handle } from '@sveltejs/kit';
import { getAll } from '$lib/backends/registry';
import { registerBackendResolvers, registerResolver } from '$lib/server/imageResolvers';
import { evictIfOverSize } from '$lib/server/imageCache';
import { register as registerCacheProvider } from '$lib/cache/registry';
import { ImageCacheProvider } from '$lib/cache/providers/image';
import { MetadataCacheProvider } from '$lib/cache/providers/metadata';
import { ApiCacheProvider } from '$lib/cache/providers/api';
import { AudioAnalysisCacheProvider } from '$lib/cache/providers/audioAnalysis';
import { MediaCacheProvider } from '$lib/cache/providers/media';
import { paraglideMiddleware } from '$lib/paraglide/server.js';
import { ensureDefaultUser } from '$lib/server/db/seed';
import { getFullConfig } from '$lib/server/db/config';
import { registerRoutes, matchPluginRoute, type PluginRoute } from '$lib/plugins/router';

// Auto-discover and register all plugin routes
interface PluginRouteModule {
	routes: PluginRoute[];
}

const routeModules = import.meta.glob<PluginRouteModule>('./lib/plugins/*/routes.ts', {
	eager: true
});

for (const [path, mod] of Object.entries(routeModules)) {
	if (!Array.isArray(mod.routes)) {
		throw new Error(
			`Plugin route module "${path}" does not export a routes array. ` +
				`Expected: export const routes: PluginRoute[] = [...]`
		);
	}
	registerRoutes(mod.routes);
}

// Register resolvers from all backends
for (const backend of getAll()) {
	if (backend.resolvers) {
		registerBackendResolvers(backend.resolvers);
	}
}

// Register fallback resolver for plain http/https
registerResolver('http', (resourcePath) => ({ url: `http://${resourcePath}` }));
registerResolver('https', (resourcePath) => ({ url: `https://${resourcePath}` }));

// Register cache providers
registerCacheProvider(new ImageCacheProvider());
registerCacheProvider(new MetadataCacheProvider());
registerCacheProvider(new ApiCacheProvider());
registerCacheProvider(new MediaCacheProvider());
registerCacheProvider(new AudioAnalysisCacheProvider());

// Check cache size on startup
evictIfOverSize();

// Ensure default user exists on startup
const defaultUser = ensureDefaultUser();

export const handle: Handle = async ({ event, resolve }) => {
	// Plugin API routes — handled before SvelteKit's file-based router
	const pluginHandler = matchPluginRoute(event);
	if (pluginHandler) return pluginHandler();

	return paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;

		event.locals.user = defaultUser;
		event.locals.config = getFullConfig(defaultUser.id);

		// Compute backend capabilities from config + registry
		const caps: string[] = [];
		for (const b of getAll()) {
			const cfg = event.locals.config.backends[b.id];
			if (cfg?.enabled) {
				caps.push(...b.capabilities);
			}
		}
		event.locals.backendCaps = caps;

		const resolvedTheme = event.locals.config.appearance.theme === 'light' ? 'light' : 'dark';

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%lang%', locale)
					.replace('<html', `<html data-theme="${resolvedTheme}"`)
		});
	});
};
