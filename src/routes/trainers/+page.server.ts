import { repo } from '#lib/server/repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id || 'a1wwZs7X2uUNTB2WZRZSMs9t4H70bUe5';
	const data = await repo.getTrainersAndGyms(userId);
	return data;
};
