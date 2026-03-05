import { apiCache } from '$lib/server/apiCache';

export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
	const hit = apiCache.get<T>(key);
	if (hit !== null) return hit;
	const data = await fn();
	apiCache.set(key, data, ttlSec * 1000);
	return data;
}
