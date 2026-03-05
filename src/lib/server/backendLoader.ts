import { get as getFromRegistry, getAll } from '$lib/backends/registry';
import type { Backend, Capability } from '$lib/backends/types';
import type { BackendsConfig } from '$lib/configTypes';

export function getEnabledBackend(id: string, backends: BackendsConfig): Backend | null {
	if (!backends[id]?.enabled) return null;
	return getFromRegistry(id) ?? null;
}

export function getBackendWithCapability(cap: Capability, backends: BackendsConfig): Backend | null {
	for (const b of getAll()) {
		if (backends[b.id]?.enabled && b.supports(cap)) return b;
	}
	return null;
}

export function getAllBackendsWithCapability(cap: Capability, backends: BackendsConfig): Backend[] {
	return getAll().filter((b) => backends[b.id]?.enabled && b.supports(cap));
}

export function resolveBackendForEntity(entityId: string, backends: BackendsConfig): Backend | null {
	for (const b of getAll()) {
		const prefix = b.metadata.idPrefix;
		if (backends[b.id]?.enabled && prefix && entityId.startsWith(prefix + '-')) return b;
	}
	return null;
}
