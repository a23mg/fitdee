import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, email, password } = await request.json();

		if (!name || !email || !password) {
			return json(
				{ success: false, error: 'Name, email and password are all required' },
				{ status: 400 }
			);
		}

		if (password.length < 6) {
			return json(
				{ success: false, error: 'Password must be at least 6 characters long' },
				{ status: 400 }
			);
		}

		const response = await auth.api.signUpEmail({
			body: { name, email, password },
			asResponse: true
		});

		const setCookie = response.headers.get('set-cookie');
		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		if (!response.ok) {
			const errData = await response.json().catch(() => ({ message: 'Registration failed' }));
			return json(
				{ success: false, error: errData.message || 'User already exists or registration failed' },
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
