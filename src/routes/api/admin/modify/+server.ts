import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (locals.user?.role !== 'admin') {
			return json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
		}

		const { targetUserId, updates } = await request.json();

		if (!targetUserId || !updates) {
			return json({ success: false, error: 'Target user ID and updates payload are required' }, { status: 400 });
		}

		const result = await repo.adminUpdateUserData(targetUserId, updates);

		if (!result.success) {
			return json({ success: false, error: result.error || 'Failed to update user' }, { status: 400 });
		}

		return json({
			success: true,
			user: result.user,
			profile: result.profile,
			challenge: result.challenge
		});
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
