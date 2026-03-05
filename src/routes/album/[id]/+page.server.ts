import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { resolveBackendForEntity } from '$lib/server/backendLoader';
import { error } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	const id = params.id ?? '';
	if (!id) error(404, 'Album not found');

	const b = resolveBackendForEntity(id, locals.config.backends);
	if (!b) error(404, 'No backend found for this album');

	try {
		const [album, tracks] = await Promise.all([
			b.getAlbum ? cached(`album:${id}`, 3600, () => b.getAlbum!(id)) : null,
			b.getAlbumTracks ? cached(`album:${id}:tracks`, 3600, () => b.getAlbumTracks!(id)) : []
		]);
		if (!album) error(404, 'Album not found');
		return { album, tracks };
	} catch (e: any) {
		if (e.status) throw e;
		error(404, e.message ?? 'Failed to load album');
	}
}) satisfies PageServerLoad;
