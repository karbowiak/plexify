import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSection } from '$lib/server/db/config';

export const GET: RequestHandler = ({ locals }) => {
	return json(locals.config);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { section, value } = await request.json();
	updateSection(locals.user.id, section, value);
	return json({ ok: true });
};
