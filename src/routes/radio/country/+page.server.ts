import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';
import type { RadioStation, RadioCountry } from '$lib/backends/types';

export const load = (async ({ url, locals }) => {
	const b = getBackendWithCapability(Capability.InternetRadio, locals.config.backends);
	const selectedId = url.searchParams.get('id');

	const countries: RadioCountry[] = b?.getRadioCountries
		? await cached('radio:countries', 86400, () => b.getRadioCountries!()).catch(() => [])
		: [];

	let stations: RadioStation[] = [];
	if (selectedId && b?.searchRadioStations) {
		stations = await cached(`radio:search:country:${selectedId}`, 900, () =>
			b.searchRadioStations!({ country: selectedId, limit: 30 })
		).catch(() => []);
	}

	return { countries, selectedId, stations };
}) satisfies PageServerLoad;
