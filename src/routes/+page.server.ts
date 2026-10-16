import { repo } from '#lib/server/repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id || 'user_alex_mercer';
	const data = await repo.getHomeData(userId);
	return data;
};
