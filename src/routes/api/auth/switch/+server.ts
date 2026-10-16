import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { userId } = await request.json();

		const user = repo.getUserById(userId);
		if (!user) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		// Create a fresh session for this user
		const authRes = await repo.authenticate(user.email);
		if (!authRes.success || !authRes.token) {
			return json({ success: false, error: 'Failed to create switch session' }, { status: 500 });
		}

		cookies.set('fitdee_session_token', authRes.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60
		});
		cookies.delete('fitdee_logged_out', { path: '/' });

		return json({
			success: true,
			user: authRes.user
		});
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
