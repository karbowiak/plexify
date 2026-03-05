import type { PageServerLoad } from './$types';
import { cached } from '$lib/server/cached';
import { getBackendWithCapability } from '$lib/server/backendLoader';
import { Capability } from '$lib/backends/types';

export const load = (async ({ locals }) => {
	const b = getBackendWithCapability(Capability.InternetRadio, locals.config.backends);
	if (!b?.getTopRadioStations) return { topVoted: [], topClicked: [], trending: [] };

	try {
		const [topVoted, topClicked, trending] = await Promise.all([
			cached('radio:top:topvote', 3600, () => b.getTopRadioStations!('topvote', 15)),
			cached('radio:top:topclick', 3600, () => b.getTopRadioStations!('topclick', 15)),
			cached('radio:top:lastchange', 3600, () => b.getTopRadioStations!('lastchange', 15))
		]);
		return { topVoted, topClicked, trending };
	} catch {
		return { topVoted: [], topClicked: [], trending: [] };
	}
}) satisfies PageServerLoad;
