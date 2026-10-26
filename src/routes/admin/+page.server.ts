import type { PageServerLoad } from './$types';
import { repo } from '#lib/server/repo';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user;
	if (!currentUser) {
		throw redirect(303, '/login');
	}
	const isAdmin = currentUser.role === 'admin' || currentUser.email === 'admin@fitdee.app';
	const users = await repo.getAllUsers();
	const sessions = await repo.getAllSessions();

	return {
		currentUser,
		isAdmin,
		users,
		sessions
	};
};
