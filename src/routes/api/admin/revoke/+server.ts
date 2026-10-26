import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '#lib/server/db';
import * as schema from '#lib/server/db/schema';
import { repo } from '#lib/server/repo';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const isAdmin = locals.user?.role === 'admin' || locals.user?.email === 'admin@fitdee.app';
		if (!isAdmin) {
			return json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
		}

		const { sessionId, token } = await request.json();

		if (!sessionId && !token) {
			return json({ success: false, error: 'Session ID or token required' }, { status: 400 });
		}

		if (sessionId) {
			await db.delete(schema.session).where(eq(schema.session.id, sessionId));
		}
		if (token) {
			await db.delete(schema.session).where(eq(schema.session.token, token));
			await repo.deleteSession(token);
		}

		return json({ success: true, message: 'Session revoked successfully' });
	} catch (err: any) {
		return json({ success: false, error: err.message || 'Server error' }, { status: 500 });
	}
};
