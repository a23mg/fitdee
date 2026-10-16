import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({ amountMl: 250 }));
	const total = await repo.logWater(body.amountMl || 250);
	return json({ success: true, waterTotal: total });
};
