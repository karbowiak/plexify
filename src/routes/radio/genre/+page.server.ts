import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import type { RadioStation, RadioTag } from '$lib/backends/types';

export const load = (async ({ url, locals }) => {
	const b = getBackendWithCapability(Capability.InternetRadio, locals.config.backends);
	const selectedId = url.searchParams.get('id');

	const tags: RadioTag[] = b?.getRadioTags
		? await cached('radio:tags', 86400, () => b.getRadioTags!(100)).catch(() => [])
		: [];

	let stations: RadioStation[] = [];
	if (selectedId && b?.searchRadioStations) {
		stations = await cached(`radio:search:tag:${selectedId}`, 900, () =>
			b.searchRadioStations!({ tag: selectedId, limit: 30 })
		).catch(() => []);
	}

	return { tags, selectedId, stations };
}) satisfies PageServerLoad;
