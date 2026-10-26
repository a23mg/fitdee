import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => ({ amountMl: 250 }));
	const userId = locals.user?.id || 'a1wwZs7X2uUNTB2WZRZSMs9t4H70bUe5';
	const total = await repo.logWater(body.amountMl || 250, userId);
	return json({ success: true, waterTotal: total });
};
