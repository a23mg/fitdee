import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ success: false, error: 'Email and password are required' }, { status: 400 });
		}

		const response = await auth.api.signInEmail({
			body: { email, password },
			asResponse: true
		});

		const setCookie = response.headers.get('set-cookie');
		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		if (!response.ok) {
			const errData = await response.json().catch(() => ({ message: 'Invalid credentials' }));
			return json(
				{ success: false, error: errData.message || 'Invalid email or password' },
				{ status: response.status, headers }
			);
		}

		const data = await response.json();
		return json(
			{
				success: true,
				user: data.user
			},
			{ headers }
		);
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
