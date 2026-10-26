import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const isAdmin = locals.user?.role === 'admin' || locals.user?.email === 'admin@fitdee.app';
		if (!isAdmin) {
			return json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
		}

		const { targetUserId, title, message, type } = await request.json();

		if (!title || !message) {
			return json({ success: false, error: 'Title and message are required' }, { status: 400 });
		}

		const notif = await repo.createNotification({
			userId: targetUserId || 'all',
			title,
			message,
			type: type || 'info'
		});

		return json({
			success: true,
			notification: notif
		});
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
