import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionToken = cookies.get('fitdee_session_token');
	if (sessionToken) {
		await repo.deleteSession(sessionToken);
	}

	cookies.delete('fitdee_session_token', { path: '/' });
	cookies.set('fitdee_logged_out', '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 30 * 24 * 60 * 60
	});

	return json({ success: true });
};
