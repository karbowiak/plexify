import type { RequestHandler } from './$types';
import { produce } from 'sveltekit-sse';
import { subscribe, publish, type BusEvent } from '$lib/server/eventBus';

/** POST — handles both SSE stream (sveltekit-sse uses POST) and event publishing */
export const POST: RequestHandler = async ({ request }) => {
	const contentType = request.headers.get('content-type') ?? '';

	// If JSON body → publish event to bus
	if (contentType.includes('application/json')) {
		const text = await request.text();
		if (!text) return new Response(null, { status: 204 });
		const event = JSON.parse(text) as BusEvent;
		publish(event);
		return new Response(null, { status: 204 });
	}

	// Otherwise → SSE stream (sveltekit-sse source() sends POST without json content-type)
	return produce(function start({ emit }) {
		const unsub = subscribe((event: BusEvent) => {
			const { error } = emit('event', JSON.stringify(event));
			if (error) unsub();
		});
		return () => unsub();
	});
};

/** GET — fallback SSE stream for native EventSource or curl testing */
export const GET: RequestHandler = async () => {
	return produce(function start({ emit }) {
		const unsub = subscribe((event: BusEvent) => {
			const { error } = emit('event', JSON.stringify(event));
			if (error) unsub();
		});
		return () => unsub();
	});
};
