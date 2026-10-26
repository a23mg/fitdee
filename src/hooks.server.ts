import { auth } from '$lib/server/auth';
import { repo } from '#lib/server/repo';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Better Auth session check via HTTP headers / cookies
	try {
		const sessionData = await auth.api.getSession({
			headers: event.request.headers
		});

		if (sessionData?.user) {
			event.locals.user = {
				id: sessionData.user.id,
				name: sessionData.user.name,
				email: sessionData.user.email,
				role: (sessionData.user as any).role || 'user',
				image: sessionData.user.image
			};
			event.locals.session = {
				id: sessionData.session.id,
				userId: sessionData.session.userId,
				expiresAt: new Date(sessionData.session.expiresAt)
			};
		} else {
			// Backward compatibility: check fallback session token if present
			const sessionToken = event.cookies.get('fitdee_session_token');
			if (sessionToken) {
				const fallbackData = await repo.validateSession(sessionToken);
				if (fallbackData) {
					event.locals.user = fallbackData.user;
					event.locals.session = fallbackData.session;
				} else {
					event.locals.user = null;
					event.locals.session = null;
				}
			} else {
				event.locals.user = null;
				event.locals.session = null;
			}
		}
	} catch (e) {
		console.warn('Session verification error:', e);
		event.locals.user = null;
		event.locals.session = null;
	}

	const pathname = event.url.pathname;

	// 2. Route Protection Rules
	const isPublicRoute =
		pathname === '/login' ||
		pathname === '/register' ||
		pathname.startsWith('/api/auth') ||
		pathname.startsWith('/_app') ||
		pathname === '/favicon.svg' ||
		pathname.startsWith('/static');

	// If unauthenticated visitor tries to access protected features, redirect to /login
	if (!event.locals.user && !isPublicRoute) {
		if (pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		throw redirect(303, '/login');
	}

	// If authenticated user visits /login or /register, redirect to dashboard
	if (event.locals.user && (pathname === '/login' || pathname === '/register')) {
		throw redirect(303, '/');
	}

	const response = await resolve(event);

	// Add WASM / MoveNet security headers for multi-threading & SIMD SharedArrayBuffer support
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

	return response;
};
