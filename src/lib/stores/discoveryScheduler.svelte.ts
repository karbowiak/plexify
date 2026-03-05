import { Capability } from '$lib/backends/types';
import { getBackendsWithCapability } from './backendStore.svelte';
import { emitDiscovery } from '$lib/events/emit';

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Poll all connected backends that support Discoveries and emit any new items.
 */
export async function pollDiscoveries(): Promise<void> {
	const backends = getBackendsWithCapability(Capability.Discoveries);

	for (const backend of backends) {
		if (!backend.checkDiscoveries) continue;
		try {
			const items = await backend.checkDiscoveries();
			for (const item of items) {
				emitDiscovery(item.type, {
					title: item.title,
					subtitle: item.subtitle,
					imageUrl: item.imageUrl,
					entityId: item.entityId,
					backendId: backend.id,
					href: item.href
				});
			}
		} catch {
			// Non-fatal — skip this backend
		}
	}
}

/**
 * Start the discovery scheduler. Runs an initial poll, then repeats every hour.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startDiscoveryScheduler(): void {
	if (timer) return;

	// Initial poll after a short delay to let the UI settle
	setTimeout(() => pollDiscoveries(), 2000);

	timer = setInterval(() => pollDiscoveries(), POLL_INTERVAL_MS);
}

/**
 * Stop the discovery scheduler.
 */
export function stopDiscoveryScheduler(): void {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}
