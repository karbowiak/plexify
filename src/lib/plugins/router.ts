/**
 * Plugin route dispatcher.
 * Plugin API routes are matched here before SvelteKit's file-based router.
 */

import type { RequestEvent } from '@sveltejs/kit';

export interface PluginRoute {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	pattern: string; // e.g. '/api/deezer/*', '/api/radio/search'
	handler: (event: RequestEvent) => Promise<Response> | Response;
}

const routes: PluginRoute[] = [];

export function registerRoutes(pluginRoutes: PluginRoute[]) {
	routes.push(...pluginRoutes);
}

function matchPattern(pattern: string, pathname: string): boolean {
	// Exact match
	if (pattern === pathname) return true;
	// Wildcard: '/api/deezer/*' matches '/api/deezer/chart', '/api/deezer/search/artist', etc.
	if (pattern.endsWith('/*')) {
		const prefix = pattern.slice(0, -2);
		return pathname === prefix || pathname.startsWith(prefix + '/');
	}
	return false;
}

export function matchPluginRoute(event: RequestEvent): (() => Promise<Response> | Response) | null {
	const { method } = event.request;
	const { pathname } = event.url;
	for (const route of routes) {
		if (route.method !== method) continue;
		if (matchPattern(route.pattern, pathname)) {
			return () => route.handler(event);
		}
	}
	return null;
}
