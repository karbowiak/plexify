import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { resolveBackendForEntity, getAllBackendsWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import type { Artist, Album, Track } from '$lib/backends/types';
import { error } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	const id = params.id ?? '';
	if (!id) error(404, 'Artist not found');

	const directBackend = resolveBackendForEntity(id, locals.config.backends);

	if (directBackend) {
		return loadFromBackend(directBackend, id);
	}

	// Fallback: resolve by name search across backends
	const name = decodeURIComponent(id);
	const backends = getAllBackendsWithCapability(Capability.Search, locals.config.backends);

	for (const b of backends) {
		try {
			const res = await b.search!(name);
			const match = res.artists.find(
				(a) => a.title.toLowerCase() === name.toLowerCase()
			);
			if (match) {
				return loadFromBackend(b, match.id);
			}
		} catch {
			/* try next */
		}
	}

	error(404, 'Artist not found');
}) satisfies PageServerLoad;

async function loadFromBackend(b: { getArtist?: (id: string) => Promise<Artist>; getArtistAlbums?: (id: string) => Promise<Album[]>; getArtistTopTracks?: (id: string, limit?: number) => Promise<Track[]>; getArtistRelated?: (id: string) => Promise<Artist[]> }, artistId: string) {
	const [artist, albums, topTracks, related] = await Promise.all([
		b.getArtist ? cached(`artist:${artistId}`, 3600, () => b.getArtist!(artistId)) : null,
		b.getArtistAlbums ? cached(`artist:${artistId}:albums`, 3600, () => b.getArtistAlbums!(artistId)).catch(() => []) : [],
		b.getArtistTopTracks ? cached(`artist:${artistId}:top`, 3600, () => b.getArtistTopTracks!(artistId, 10)).catch(() => []) : [],
		b.getArtistRelated ? cached(`artist:${artistId}:related`, 3600, () => b.getArtistRelated!(artistId)).catch(() => []) : []
	]);

	if (!artist) error(404, 'Artist not found');
	return { artist, albums, topTracks, related };
}
