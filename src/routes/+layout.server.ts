import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	config: locals.config,
	backendCaps: locals.backendCaps
});
