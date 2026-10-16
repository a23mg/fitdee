import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { name, email, password } = await request.json();

		if (!name || !email) {
			return json({ success: false, error: 'Name and email are required' }, { status: 400 });
		}

		const result = await repo.register({ name, email, password });

		if (!result.success || !result.token) {
			return json({ success: false, error: result.error || 'Registration failed' }, { status: 400 });
		}

		cookies.set('fitdee_session_token', result.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60
		});
		cookies.delete('fitdee_logged_out', { path: '/' });

		return json({
			success: true,
			user: result.user
		});
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
