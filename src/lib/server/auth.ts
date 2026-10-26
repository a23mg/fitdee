import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	user: {
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'user',
				required: false
			}
		}
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true
	},
	secret: process.env.BETTER_AUTH_SECRET || 'fitdee_secret_jwt_32_characters_minimum_prod',
	databaseHooks: {
		user: {
			create: {
				after: async (createdUser) => {
					try {
						await db
							.insert(schema.profiles)
							.values({
								id: 'profile_' + createdUser.id,
								userId: createdUser.id,
								heightCm: 178,
								currentWeightKg: 73.0,
								targetWeightKg: 70.0,
								bodyFatPercent: 15.0,
								muscleMassKg: 35.5,
								dailyCalorieTarget: 2300,
								dailyWaterTargetMl: 3000,
								fitnessLevel: 'New Athlete Protocol',
								activeTier: '1-Year Protocol'
							})
							.onConflictDoNothing();

						const today = new Date().toISOString().split('T')[0];
						await db
							.insert(schema.wakeUpChallenges)
							.values({
								id: 'wake_' + createdUser.id,
								userId: createdUser.id,
								targetTime: '06:30 AM',
								shakeTarget: 30,
								currentShakes: 0,
								isCompleted: false,
								date: today
							})
							.onConflictDoNothing();

						const routineId = 'routine_' + createdUser.id;
						await db
							.insert(schema.routines)
							.values({
								id: routineId,
								userId: createdUser.id,
								name: 'Hypertrophy Block A',
								category: 'Chest & Triceps',
								durationMinutes: 45,
								scheduledTime: '05:30 PM',
								isCompleted: false,
								date: today
							})
							.onConflictDoNothing();

						await db
							.insert(schema.exercises)
							.values([
								{
									id: 'ex_1_' + createdUser.id,
									routineId,
									name: 'Barbell Bench Press',
									targetArea: 'Mid Chest • 4 sets × 10 reps (70 kg)',
									sets: 4,
									reps: 10,
									weightKg: 70,
									completedSets: 0,
									isDone: false
								},
								{
									id: 'ex_2_' + createdUser.id,
									routineId,
									name: 'Incline Dumbbell Flyes',
									targetArea: 'Upper Chest • 3 sets × 12 reps (16 kg)',
									sets: 3,
									reps: 12,
									weightKg: 16,
									completedSets: 0,
									isDone: false
								},
								{
									id: 'ex_3_' + createdUser.id,
									routineId,
									name: 'Triceps Rope Pushdown',
									targetArea: 'Triceps • 4 sets × 15 reps (22 kg)',
									sets: 4,
									reps: 15,
									weightKg: 22,
									completedSets: 0,
									isDone: false
								}
							])
							.onConflictDoNothing();
					} catch (e) {
						console.error('Error auto-creating starter records for new user:', e);
					}
				}
			}
		}
	}
});
