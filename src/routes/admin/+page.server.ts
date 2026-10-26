import type { PageServerLoad } from './$types';
import { repo } from '#lib/server/repo';
import { db } from '#lib/server/db';
import * as schema from '#lib/server/db/schema';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user;
	if (!currentUser) {
		throw redirect(303, '/login');
	}
	const isAdmin = currentUser.role === 'admin' || currentUser.email === 'admin@fitdee.app';

	const dbPingStart = performance.now();
	const [users, sessions] = await Promise.all([repo.getAllUsers(), repo.getAllSessions()]);

	// Fetch live DB counts for system metrics
	let dbCounts = {
		totalUsers: users.length,
		totalSessions: sessions.length,
		totalRoutines: 0,
		totalExercises: 0,
		totalMeals: 0,
		totalBookings: 0,
		totalTrainers: 0,
		totalChallenges: 0,
		dbLatencyMs: 0
	};

	try {
		const [routines, exercises, meals, bookings, trainers, challenges] = await Promise.all([
			db.select().from(schema.routines),
			db.select().from(schema.exercises),
			db.select().from(schema.mealLogs),
			db.select().from(schema.trainerBookings),
			db.select().from(schema.trainers),
			db.select().from(schema.wakeUpChallenges)
		]);

		dbCounts = {
			totalUsers: users.length,
			totalSessions: sessions.length,
			totalRoutines: routines.length,
			totalExercises: exercises.length,
			totalMeals: meals.length,
			totalBookings: bookings.length,
			totalTrainers: trainers.length,
			totalChallenges: challenges.length,
			dbLatencyMs: Math.round(performance.now() - dbPingStart)
		};
	} catch (e) {
		dbCounts.dbLatencyMs = Math.round(performance.now() - dbPingStart);
	}

	return {
		currentUser,
		isAdmin,
		users,
		sessions,
		dbCounts,
		serverInfo: {
			nodeEnv: process.env.NODE_ENV || 'development',
			isVercel: !!process.env.VERCEL,
			vercelRegion: process.env.VERCEL_REGION || 'iad1 (us-east-1)',
			serverTime: new Date().toISOString()
		}
	};
};
