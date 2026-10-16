import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (body.action === 'reset') {
		const res = await repo.resetAlarm();
		return json({ success: true, ...res });
	}
	const res = await repo.simulateShake();
	return json({ success: true, ...res });
};
