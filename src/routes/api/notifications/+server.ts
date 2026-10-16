import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id || 'user_alex_mercer';
	const notifications = await repo.getNotifications(userId);
	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return json({
		success: true,
		notifications,
		unreadCount
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { id, clearAll } = await request.json();
		const userId = locals.user?.id || 'user_alex_mercer';

		if (clearAll) {
			await repo.clearNotifications(userId);
			return json({ success: true });
		}

		if (id) {
			await repo.markNotificationRead(id);
			return json({ success: true });
		}

		return json({ success: false, error: 'Invalid notification action' }, { status: 400 });
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
