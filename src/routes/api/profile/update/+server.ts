import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const profile = await repo.updateProfile(body);
	return json({ success: true, profile });
};
