/**
 * Server-side event bus for SSE push.
 * Mirrors the icyMetadataStore.ts pattern — simple pub/sub.
 */

export interface BusEvent {
	category: string;
	type: string;
	timestamp: string | Date;
	payload: Record<string, unknown>;
}

type EventListener = (event: BusEvent) => void;

const listeners = new Set<EventListener>();

export function subscribe(cb: EventListener): () => void {
	listeners.add(cb);
	return () => {
		listeners.delete(cb);
	};
}

export function publish(event: BusEvent): void {
	for (const cb of listeners) {
		cb(event);
	}
}
