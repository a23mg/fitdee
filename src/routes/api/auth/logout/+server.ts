import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const response = await auth.api.signOut({
			headers: request.headers,
			asResponse: true
		});

		cookies.delete('better-auth.session_token', { path: '/' });
		cookies.delete('fitdee_session_token', { path: '/' });

		const setCookie = response.headers.get('set-cookie');
		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		return json({ success: true }, { headers });
	} catch (err: any) {
		cookies.delete('better-auth.session_token', { path: '/' });
		cookies.delete('fitdee_session_token', { path: '/' });
		return json({ success: true });
	}
};
