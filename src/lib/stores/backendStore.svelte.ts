import type { Backend } from '$lib/backends/types';
import { Capability } from '$lib/backends/types';
import * as registry from '$lib/backends/registry';
import { getBackendConfig, getGeneral, setBackend, setGeneral } from './configStore.svelte';

let activeBackendId = $state<string | null>(null);
let connectedBackends = $state(new Map<string, Backend>());
let ssrCapabilities = $state(new Set<string>());

// ---------------------------------------------------------------------------
// Primary music backend (backward compat)
// ---------------------------------------------------------------------------

export function getBackend(): Backend | null {
	if (!activeBackendId) return null;
	return connectedBackends.get(activeBackendId) ?? null;
}

function getActiveBackendId(): string | null {
	return activeBackendId;
}

// ---------------------------------------------------------------------------
// Multi-backend queries
// ---------------------------------------------------------------------------

export function getBackendsWithCapability(cap: Capability): Backend[] {
	return [...connectedBackends.values()].filter((b) => b.supports(cap));
}

export function getFirstBackendWithCapability(cap: Capability): Backend | null {
	for (const b of connectedBackends.values()) {
		if (b.supports(cap)) return b;
	}
	return null;
}

function getConnectedBackends(): Map<string, Backend> {
	return connectedBackends;
}

// ---------------------------------------------------------------------------
// Capability helpers (union of all connected)
// ---------------------------------------------------------------------------

function getCapabilities(): Set<Capability> {
	const caps = new Set<Capability>();
	for (const b of connectedBackends.values()) {
		for (const c of b.capabilities) caps.add(c);
	}
	return caps;
}

export function hasCapability(cap: Capability): boolean {
	for (const b of connectedBackends.values()) {
		if (b.supports(cap)) return true;
	}
	// SSR fallback — capabilities seeded from server before backends connect
	if (ssrCapabilities.has(cap)) return true;
	return false;
}

export function isConnected(): boolean {
	if (connectedBackends.size > 0) return true;
	// SSR fallback
	return ssrCapabilities.size > 0;
}

// ---------------------------------------------------------------------------
// Connect / disconnect individual backends
// ---------------------------------------------------------------------------

export async function connectBackend(id: string, config: Record<string, unknown> = {}): Promise<void> {
	const instance = registry.get(id);
	if (!instance) throw new Error(`Backend "${id}" not found in registry`);

	if (instance.isConnected()) return;

	await instance.connect(config);

	const updated = new Map(connectedBackends);
	updated.set(id, instance);
	connectedBackends = updated;

	setBackend(id, { enabled: true, config });
}

export async function disconnectBackend(id: string): Promise<void> {
	const instance = connectedBackends.get(id);
	if (!instance) return;

	try {
		await instance.disconnect();
	} catch {
		// ignore
	}

	const updated = new Map(connectedBackends);
	updated.delete(id);
	connectedBackends = updated;

	if (activeBackendId === id) {
		activeBackendId = null;
		setGeneral({ activeBackendId: null });
	}
}

// ---------------------------------------------------------------------------
// Set primary music backend
// ---------------------------------------------------------------------------

function setActiveMusicBackend(id: string): void {
	if (!connectedBackends.has(id)) return;
	activeBackendId = id;
	setGeneral({ activeBackendId: id });
}

// ---------------------------------------------------------------------------
// Set active backend (legacy — connects + sets as primary music backend)
// ---------------------------------------------------------------------------

async function setActiveBackend(id: string, config: Record<string, unknown> = {}): Promise<void> {
	await connectBackend(id, config);
	setActiveMusicBackend(id);
}

// ---------------------------------------------------------------------------
// Restore all enabled backends on startup
// ---------------------------------------------------------------------------

export async function restoreBackends(): Promise<void> {
	for (const b of registry.getAll()) {
		const cfg = getBackendConfig(b.id);
		if (cfg.enabled) {
			try {
				await connectBackend(b.id, cfg.config);
			} catch {
				// Failed to connect — skip
			}
		}
	}

	// Restore active music backend from config
	const savedId = getGeneral().activeBackendId;
	if (savedId && connectedBackends.has(savedId)) {
		activeBackendId = savedId;
	} else {
		// Default to first connected backend that has music capabilities
		for (const b of connectedBackends.values()) {
			if (b.supports(Capability.Tracks) || b.supports(Capability.Search)) {
				activeBackendId = b.id;
				setGeneral({ activeBackendId: b.id });
				break;
			}
		}
	}

	// Clear SSR fallback now that real backends are connected
	ssrCapabilities = new Set();
}

// ---------------------------------------------------------------------------
// Entity ID resolution
// ---------------------------------------------------------------------------

export function resolveEntityBackend(entityId: string): Backend | null {
	for (const b of connectedBackends.values()) {
		const prefix = b.metadata.idPrefix;
		if (prefix && entityId.startsWith(prefix + '-')) return b;
	}
	return null;
}

// ---------------------------------------------------------------------------
// SSR capability seeding
// ---------------------------------------------------------------------------

export function initCapabilitiesFromSSR(caps: string[]) {
	ssrCapabilities = new Set(caps);
}

