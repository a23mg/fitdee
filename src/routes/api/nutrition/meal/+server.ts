import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const userId = locals.user?.id || 'a1wwZs7X2uUNTB2WZRZSMs9t4H70bUe5';
	const meal = await repo.addMeal(body, userId);
	return json({ success: true, meal });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await repo.deleteMeal(body.mealId);
	return json({ success: true });
};
