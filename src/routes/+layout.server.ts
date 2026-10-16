import type { LayoutServerLoad } from './$types';
import { repo } from '#lib/server/repo';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const notifications = user ? await repo.getNotifications(user.id) : [];
	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return {
		user,
		session: locals.session,
		notifications,
		unreadCount
	};
};
