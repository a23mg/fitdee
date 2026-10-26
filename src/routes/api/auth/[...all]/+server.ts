import { auth } from '$lib/server/auth';
import { toSvelteKitHandler } from 'better-auth/svelte-kit';
import type { RequestHandler } from './$types';

const handler = toSvelteKitHandler(auth);

export const GET: RequestHandler = async (event) => {
	return handler(event);
};

export const POST: RequestHandler = async (event) => {
	return handler(event);
};
