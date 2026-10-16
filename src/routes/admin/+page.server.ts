import type { PageServerLoad } from './$types';
import { repo } from '#lib/server/repo';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user;
	const isAdmin = currentUser?.role === 'admin';
	const users = repo.getAllUsers();
	const sessions = repo.getAllSessions();

	return {
		currentUser,
		isAdmin,
		users,
		sessions
	};
};
