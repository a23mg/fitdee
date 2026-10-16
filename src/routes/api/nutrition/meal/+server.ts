import { json } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const meal = await repo.addMeal(body);
	return json({ success: true, meal });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await repo.deleteMeal(body.mealId);
	return json({ success: true });
};
