import { json, type RequestHandler } from '@sveltejs/kit';
import { repo } from '#lib/server/repo';
import { auth } from '#lib/server/auth';
import { db } from '#lib/server/db';
import * as schema from '#lib/server/db/schema';
import { eq, or } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { userId } = await request.json();

		let userEmail: string | undefined;

		if (userId === 'user_admin_ops' || userId === 'admin@fitdee.app') {
			userEmail = 'admin@fitdee.app';
		} else if (userId === 'user_alex_mercer' || userId === 'alex@fitdee.app') {
			userEmail = 'alex@fitdee.app';
		} else {
			const [dbUser] = await db
				.select()
				.from(schema.user)
				.where(or(eq(schema.user.id, userId), eq(schema.user.email, userId)))
				.limit(1);

			if (dbUser) {
				userEmail = dbUser.email;
			} else {
				const u = repo.getUserById(userId);
				userEmail = u?.email;
			}
		}

		if (!userEmail) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		const pass = userEmail === 'admin@fitdee.app' ? 'adminpassword123' : 'password123';
		const signInRes = await auth.api
			.signInEmail({
				body: { email: userEmail, password: pass },
				asResponse: true
			})
			.catch(() => null);

		const headers = new Headers();
		if (signInRes && signInRes.ok) {
			const sc = signInRes.headers.get('set-cookie');
			if (sc) headers.set('set-cookie', sc);
			const data = await signInRes.json();
			return json({ success: true, user: data.user }, { headers });
		}

		const authRes = await repo.authenticate(userEmail);
		if (authRes.success && authRes.token) {
			cookies.set('fitdee_session_token', authRes.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60
			});
			return json({ success: true, user: authRes.user });
		}

		return json({ success: false, error: 'Unable to switch account' }, { status: 400 });
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
