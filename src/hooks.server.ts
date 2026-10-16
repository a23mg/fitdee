import { repo } from '#lib/server/repo';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('fitdee_session_token');

	if (sessionToken) {
		const sessionData = await repo.validateSession(sessionToken);
		if (sessionData) {
			event.locals.user = sessionData.user;
			event.locals.session = sessionData.session;
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	} else {
		// First-time guest visit: default to Alex Mercer demo account so app is immediately interactive
		const isLoggedOut = event.cookies.get('fitdee_logged_out');
		if (!isLoggedOut) {
			event.locals.user = repo.getUserById('user_alex_mercer');
			event.locals.session = null;
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	}

	const response = await resolve(event);

	// Add WASM / MoveNet security headers for multi-threading & SIMD SharedArrayBuffer support
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

	return response;
};

