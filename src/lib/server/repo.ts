import { client, db, schema } from './db';
import { eq, desc, and } from 'drizzle-orm';
import { seedDatabase } from './db/seed';

// Persistent store fallback when Postgres is offline
let isPostgresAvailable: boolean | null = null;

async function checkPostgres() {
	if (isPostgresAvailable !== null) return isPostgresAvailable;
	try {
		await client`SELECT 1`;
		isPostgresAvailable = true;
		try {
			await seedDatabase();
		} catch (e) {
			console.warn('Seed notice:', e);
		}
	} catch (err) {
		isPostgresAvailable = false;
		console.warn('⚠️ PostgreSQL offline. Operating with high-performance persistent fallback.');
	}
	return isPostgresAvailable;
}

// Multi-user & Multi-session in-memory data store with PG fallback
const initialUsers = [
	{
		id: 'user_alex_mercer',
		name: 'Alex Mercer',
		email: 'alex@fitdee.app',
		password: 'password123',
		role: 'user',
		image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
		emailVerified: true,
		createdAt: new Date('2026-01-01T00:00:00Z')
	},
	{
		id: 'user_admin_ops',
		name: 'Fitdee Ops Admin',
		email: 'admin@fitdee.app',
		password: 'adminpassword123',
		role: 'admin',
		image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
		emailVerified: true,
		createdAt: new Date('2026-01-01T00:00:00Z')
	}
];

const initialProfiles: Record<string, any> = {
	user_alex_mercer: {
		id: 'profile_user_alex_mercer',
		userId: 'user_alex_mercer',
		heightCm: 182,
		currentWeightKg: 74.5,
		targetWeightKg: 72.0,
		bodyFatPercent: 14.8,
		muscleMassKg: 36.2,
		dailyCalorieTarget: 2400,
		dailyWaterTargetMl: 3000,
		fitnessLevel: 'Hypertrophy Focus',
		activeTier: '1-Year Protocol'
	},
	user_admin_ops: {
		id: 'profile_user_admin_ops',
		userId: 'user_admin_ops',
		heightCm: 180,
		currentWeightKg: 80.0,
		targetWeightKg: 78.0,
		bodyFatPercent: 12.5,
		muscleMassKg: 42.0,
		dailyCalorieTarget: 2800,
		dailyWaterTargetMl: 3500,
		fitnessLevel: 'Ops Diagnostic Mode',
		activeTier: 'Master Admin Protocol'
	}
};

const initialChallenges: Record<string, any> = {
	user_alex_mercer: {
		id: 'wake_alex',
		userId: 'user_alex_mercer',
		targetTime: '06:30 AM',
		shakeTarget: 30,
		currentShakes: 18,
		isCompleted: false,
		date: new Date().toISOString().split('T')[0]
	},
	user_admin_ops: {
		id: 'wake_admin',
		userId: 'user_admin_ops',
		targetTime: '06:00 AM',
		shakeTarget: 50,
		currentShakes: 50,
		isCompleted: true,
		date: new Date().toISOString().split('T')[0]
	}
};

const fallbackStore = {
	users: [...initialUsers],
	profiles: { ...initialProfiles },
	challenges: { ...initialChallenges },
	sessions: [
		{
			id: 'sess_alex_default',
			token: 'fitdee_token_alex_mercer',
			userId: 'user_alex_mercer',
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 30 * 86400000)
		},
		{
			id: 'sess_admin_default',
			token: 'fitdee_token_admin_ops',
			userId: 'user_admin_ops',
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 30 * 86400000)
		}
	],
	notifications: [
		{
			id: 'notif_1',
			userId: 'user_alex_mercer',
			title: 'Biomechanical Depth Target',
			message: 'Your squat depth reached optimal 88° on set 3.',
			type: 'info',
			isRead: false,
			createdAt: new Date(Date.now() - 1000 * 60 * 15)
		},
		{
			id: 'notif_2',
			userId: 'all',
			title: 'Hydration Target',
			message: '1,250 ml remaining for 3L target. Stay hydrated!',
			type: 'info',
			isRead: false,
			createdAt: new Date(Date.now() - 1000 * 60 * 45)
		}
	],
	get user() {
		return this.users[0];
	},
	get profile() {
		return this.profiles['user_alex_mercer'];
	},
	get wakeUpChallenge() {
		return this.challenges['user_alex_mercer'];
	},
	weightLogs: [
		{ id: 'w1', userId: 'user_alex_mercer', weightKg: 76.5, bodyFatPercent: 15.6, muscleMassKg: 35.8, date: '2026-10-02', notes: 'Baseline start' },
		{ id: 'w2', userId: 'user_alex_mercer', weightKg: 75.9, bodyFatPercent: 15.3, muscleMassKg: 36.0, date: '2026-10-06', notes: 'Post leg day' },
		{ id: 'w3', userId: 'user_alex_mercer', weightKg: 75.2, bodyFatPercent: 15.0, muscleMassKg: 36.1, date: '2026-10-10', notes: 'Hydrated morning' },
		{ id: 'w4', userId: 'user_alex_mercer', weightKg: 74.5, bodyFatPercent: 14.8, muscleMassKg: 36.2, date: new Date().toISOString().split('T')[0], notes: 'Peak conditioning' }
	],
	routine: {
		id: 'routine_1',
		userId: 'user_alex_mercer',
		name: 'Hypertrophy Block A',
		category: 'Chest & Triceps',
		durationMinutes: 45,
		scheduledTime: '05:30 PM',
		isCompleted: false,
		date: new Date().toISOString().split('T')[0]
	},
	exercises: [
		{ id: 'ex_1', routineId: 'routine_1', name: 'Barbell Bench Press', targetArea: 'Mid Chest • 4 sets × 10 reps (70 kg)', sets: 4, reps: 10, weightKg: 70, completedSets: 4, isDone: true },
		{ id: 'ex_2', routineId: 'routine_1', name: 'Incline Dumbbell Flyes', targetArea: 'Upper Chest • 3 sets × 12 reps (16 kg)', sets: 3, reps: 12, weightKg: 16, completedSets: 0, isDone: false },
		{ id: 'ex_3', routineId: 'routine_1', name: 'Triceps Rope Pushdown', targetArea: 'Triceps • 4 sets × 15 reps (22 kg)', sets: 4, reps: 15, weightKg: 22, completedSets: 0, isDone: false }
	],
	waterLogs: [
		{ id: 'wt_1', userId: 'user_alex_mercer', amountMl: 500, date: new Date().toISOString().split('T')[0] },
		{ id: 'wt_2', userId: 'user_alex_mercer', amountMl: 500, date: new Date().toISOString().split('T')[0] },
		{ id: 'wt_3', userId: 'user_alex_mercer', amountMl: 750, date: new Date().toISOString().split('T')[0] }
	],
	mealLogs: [
		{
			id: 'm_1',
			userId: 'user_alex_mercer',
			mealType: 'breakfast',
			foodName: 'Avocado Sourdough & Poached Eggs',
			calories: 480,
			proteinGrams: 24,
			carbsGrams: 42,
			fatGrams: 22,
			imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80',
			notes: 'Pre-workout carbs & healthy fats',
			date: new Date().toISOString().split('T')[0]
		},
		{
			id: 'm_2',
			userId: 'user_alex_mercer',
			mealType: 'lunch',
			foodName: 'Grilled Chicken Breast & Mediterranean Quinoa',
			calories: 650,
			proteinGrams: 54,
			carbsGrams: 58,
			fatGrams: 16,
			imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
			notes: 'High protein recovery bowl',
			date: new Date().toISOString().split('T')[0]
		},
		{
			id: 'm_3',
			userId: 'user_alex_mercer',
			mealType: 'snack',
			foodName: 'Whey Isolate Shake with Berries',
			calories: 220,
			proteinGrams: 32,
			carbsGrams: 14,
			fatGrams: 3,
			imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&auto=format&fit=crop&q=80',
			notes: 'Post workout shake',
			date: new Date().toISOString().split('T')[0]
		}
	],
	trainers: [
		{
			id: 'tr_1',
			name: 'Marcus Vance',
			roleTitle: 'Elite Biomechanics & Strength Coach',
			specialty: 'Hypertrophy & Kinetic Symmetry',
			rating: 4.95,
			reviewCount: 142,
			hourlyRateUsd: 75,
			experienceYears: 8,
			bio: 'CSCS certified specialist focusing on compound load optimization, kinetic chain alignment, and injury prevention.',
			avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
			location: 'Apex Performance Lab, Downtown',
			isVerified: true
		},
		{
			id: 'tr_2',
			name: 'Elena Rostova',
			roleTitle: 'Olympic Weightlifting & Mobility Specialist',
			specialty: 'Explosive Power, Deceleration & Thoracic Mobility',
			rating: 4.92,
			reviewCount: 98,
			hourlyRateUsd: 85,
			experienceYears: 10,
			bio: 'Former national athlete specializing in explosive power development, thoracic spine mobility, and posture correction.',
			avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
			location: 'Iron Sanctuary, Westside',
			isVerified: true
		},
		{
			id: 'tr_3',
			name: 'David Chen',
			roleTitle: 'Metabolic Conditioning & Calisthenics',
			specialty: 'High-Velocity Endurance & Bodyweight Dynamics',
			rating: 4.88,
			reviewCount: 115,
			hourlyRateUsd: 65,
			experienceYears: 6,
			bio: 'Passionate about athletic durability, VO2 max optimization, and biomechanical posture feedback.',
			avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
			location: 'Pulse Kinetic Studio, Midtown',
			isVerified: true
		}
	],
	gyms: [
		{
			id: 'gym_1',
			name: 'Apex Performance Hub',
			location: '742 Cyber Parkway, Suite 100',
			rating: 4.9,
			memberCount: 520,
			imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
			facilities: 'Eleiko Plates • Saunas • Cryo Chamber • MoveNet Optical Pods',
			monthlyRateUsd: 110
		},
		{
			id: 'gym_2',
			name: 'Iron Sanctuary',
			location: '18 Industrial Way, District 4',
			rating: 4.85,
			memberCount: 380,
			imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
			facilities: 'Monolifts • Power Racks • Turf Sprint Track • Recovery Lounge',
			monthlyRateUsd: 89
		}
	],
	bookings: [
		{
			id: 'bk_1',
			userId: 'user_alex_mercer',
			trainerId: 'tr_1',
			trainerName: 'Marcus Vance',
			date: 'Tomorrow',
			timeSlot: '10:00 AM - 11:00 AM',
			status: 'confirmed',
			notes: 'Squat depth biomechanical assessment'
		}
	]
};

export const repo = {
	async getHomeData(userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		const today = new Date().toISOString().split('T')[0];

		if (isPg) {
			try {
				const [userRecord] = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
				const [profileRecord] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
				const [challenge] = await db.select().from(schema.wakeUpChallenges).where(eq(schema.wakeUpChallenges.userId, userId)).limit(1);
				const [routine] = await db.select().from(schema.routines).where(eq(schema.routines.userId, userId)).limit(1);
				const exerciseList = routine ? await db.select().from(schema.exercises).where(eq(schema.exercises.routineId, routine.id)) : [];
				const water = await db.select().from(schema.waterLogs).where(and(eq(schema.waterLogs.userId, userId), eq(schema.waterLogs.date, today)));
				const meals = await db.select().from(schema.mealLogs).where(and(eq(schema.mealLogs.userId, userId), eq(schema.mealLogs.date, today)));

				const totalWater = water.reduce((acc, w) => acc + w.amountMl, 0);
				const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
				const totalProtein = meals.reduce((acc, m) => acc + m.proteinGrams, 0);
				const totalCarbs = meals.reduce((acc, m) => acc + m.carbsGrams, 0);
				const totalFat = meals.reduce((acc, m) => acc + m.fatGrams, 0);

				return {
					user: userRecord || fallbackStore.user,
					profile: profileRecord || fallbackStore.profile,
					challenge: challenge || fallbackStore.wakeUpChallenge,
					routine: routine || fallbackStore.routine,
					exercises: exerciseList.length > 0 ? exerciseList : fallbackStore.exercises,
					waterTotal: totalWater,
					meals,
					macros: {
						calories: totalCalories,
						protein: totalProtein,
						carbs: totalCarbs,
						fat: totalFat
					}
				};
			} catch (err) {
				console.error('Postgres query error, using fallback:', err);
			}
		}

		// Fallback compute
		const targetUser = fallbackStore.users.find((u) => u.id === userId) || fallbackStore.users[0];
		const targetProfile = fallbackStore.profiles[userId] || fallbackStore.profiles['user_alex_mercer'];
		const targetChallenge = fallbackStore.challenges[userId] || fallbackStore.challenges['user_alex_mercer'];

		const userWater = fallbackStore.waterLogs.filter((w) => w.userId === userId || w.userId === 'user_alex_mercer');
		const userMeals = fallbackStore.mealLogs.filter((m) => m.userId === userId || m.userId === 'user_alex_mercer');

		const totalWater = userWater.reduce((acc, w) => acc + w.amountMl, 0);
		const totalCalories = userMeals.reduce((acc, m) => acc + m.calories, 0);
		const totalProtein = userMeals.reduce((acc, m) => acc + m.proteinGrams, 0);
		const totalCarbs = userMeals.reduce((acc, m) => acc + m.carbsGrams, 0);
		const totalFat = userMeals.reduce((acc, m) => acc + m.fatGrams, 0);

		return {
			user: targetUser,
			profile: targetProfile,
			challenge: targetChallenge,
			routine: fallbackStore.routine,
			exercises: fallbackStore.exercises,
			waterTotal: totalWater,
			meals: userMeals,
			macros: {
				calories: totalCalories,
				protein: totalProtein,
				carbs: totalCarbs,
				fat: totalFat
			}
		};
	},

	async simulateShake(userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const [challenge] = await db.select().from(schema.wakeUpChallenges).where(eq(schema.wakeUpChallenges.userId, userId)).limit(1);
				if (challenge) {
					const nextShakes = Math.min(challenge.shakeTarget, challenge.currentShakes + 1);
					await db.update(schema.wakeUpChallenges).set({
						currentShakes: nextShakes,
						isCompleted: nextShakes >= challenge.shakeTarget
					}).where(eq(schema.wakeUpChallenges.id, challenge.id));
					return { currentShakes: nextShakes, shakeTarget: challenge.shakeTarget };
				}
			} catch (e) {
				console.warn('Simulate shake PG error:', e);
			}
		}
		fallbackStore.wakeUpChallenge.currentShakes = Math.min(fallbackStore.wakeUpChallenge.shakeTarget, fallbackStore.wakeUpChallenge.currentShakes + 1);
		fallbackStore.wakeUpChallenge.isCompleted = fallbackStore.wakeUpChallenge.currentShakes >= fallbackStore.wakeUpChallenge.shakeTarget;
		return { currentShakes: fallbackStore.wakeUpChallenge.currentShakes, shakeTarget: fallbackStore.wakeUpChallenge.shakeTarget };
	},

	async resetAlarm(userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				await db.update(schema.wakeUpChallenges).set({
					currentShakes: 0,
					isCompleted: false
				}).where(eq(schema.wakeUpChallenges.userId, userId));
				return { currentShakes: 0 };
			} catch (e) {
				console.warn('Reset alarm PG error:', e);
			}
		}
		fallbackStore.wakeUpChallenge.currentShakes = 0;
		fallbackStore.wakeUpChallenge.isCompleted = false;
		return { currentShakes: 0 };
	},

	async toggleExercise(exerciseId: string) {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const [ex] = await db.select().from(schema.exercises).where(eq(schema.exercises.id, exerciseId)).limit(1);
				if (ex) {
					const nextDone = !ex.isDone;
					const completedSets = nextDone ? ex.sets : 0;
					await db.update(schema.exercises).set({
						isDone: nextDone,
						completedSets
					}).where(eq(schema.exercises.id, exerciseId));
					return { id: exerciseId, isDone: nextDone, completedSets };
				}
			} catch (e) {
				console.warn('Toggle exercise PG error:', e);
			}
		}
		const ex = fallbackStore.exercises.find((e) => e.id === exerciseId);
		if (ex) {
			ex.isDone = !ex.isDone;
			ex.completedSets = ex.isDone ? ex.sets : 0;
			return { id: ex.id, isDone: ex.isDone, completedSets: ex.completedSets };
		}
		return null;
	},

	async logWater(amountMl = 250, userId = 'user_alex_mercer') {
		const today = new Date().toISOString().split('T')[0];
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				await db.insert(schema.waterLogs).values({
					id: 'wt_' + Math.random().toString(36).substring(2, 9),
					userId,
					amountMl,
					date: today
				});
				const water = await db.select().from(schema.waterLogs).where(and(eq(schema.waterLogs.userId, userId), eq(schema.waterLogs.date, today)));
				return water.reduce((acc, w) => acc + w.amountMl, 0);
			} catch (e) {
				console.warn('Water log PG error:', e);
			}
		}
		fallbackStore.waterLogs.push({
			id: 'wt_' + Math.random().toString(36).substring(2, 9),
			userId,
			amountMl,
			date: today
		});
		return fallbackStore.waterLogs.reduce((acc, w) => acc + w.amountMl, 0);
	},

	async addMeal(mealData: {
		foodName: string;
		mealType: string;
		calories: number;
		proteinGrams: number;
		carbsGrams: number;
		fatGrams: number;
		imageUrl?: string;
		notes?: string;
	}, userId = 'user_alex_mercer') {
		const today = new Date().toISOString().split('T')[0];
		const isPg = await checkPostgres();
		const mealId = 'm_' + Math.random().toString(36).substring(2, 9);
		const newMeal = {
			id: mealId,
			userId,
			mealType: mealData.mealType,
			foodName: mealData.foodName,
			calories: Number(mealData.calories),
			proteinGrams: Number(mealData.proteinGrams) || 0,
			carbsGrams: Number(mealData.carbsGrams) || 0,
			fatGrams: Number(mealData.fatGrams) || 0,
			imageUrl: mealData.imageUrl || null,
			notes: mealData.notes || '',
			date: today
		};

		if (isPg) {
			try {
				await db.insert(schema.mealLogs).values(newMeal);
				return newMeal;
			} catch (e) {
				console.warn('Add meal PG error:', e);
			}
		}

		fallbackStore.mealLogs.unshift(newMeal as any);
		return newMeal;
	},

	async deleteMeal(mealId: string) {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				await db.delete(schema.mealLogs).where(eq(schema.mealLogs.id, mealId));
				return true;
			} catch (e) {
				console.warn('Delete meal PG error:', e);
			}
		}
		fallbackStore.mealLogs = fallbackStore.mealLogs.filter((m) => m.id !== mealId);
		return true;
	},

	async getNutritionViewData(userId = 'user_alex_mercer') {
		const home = await this.getHomeData(userId);
		return {
			profile: home.profile,
			meals: home.meals,
			macros: home.macros,
			waterTotal: home.waterTotal
		};
	},

	async getTrainersAndGyms(userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const trainersList = await db.select().from(schema.trainers);
				const gymsList = await db.select().from(schema.gyms);
				const userBookings = await db.select().from(schema.trainerBookings).where(eq(schema.trainerBookings.userId, userId));
				return {
					trainers: trainersList.length > 0 ? trainersList : fallbackStore.trainers,
					gyms: gymsList.length > 0 ? gymsList : fallbackStore.gyms,
					bookings: userBookings.length > 0 ? userBookings : fallbackStore.bookings
				};
			} catch (e) {
				console.warn('Trainers/gyms PG error:', e);
			}
		}
		return {
			trainers: fallbackStore.trainers,
			gyms: fallbackStore.gyms,
			bookings: fallbackStore.bookings
		};
	},

	async bookTrainer(bookingData: { trainerId: string; date: string; timeSlot: string; notes?: string }, userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		const id = 'bk_' + Math.random().toString(36).substring(2, 9);
		const booking = {
			id,
			userId,
			trainerId: bookingData.trainerId,
			date: bookingData.date,
			timeSlot: bookingData.timeSlot,
			status: 'confirmed',
			notes: bookingData.notes || '',
			createdAt: new Date()
		};

		if (isPg) {
			try {
				await db.insert(schema.trainerBookings).values(booking);
				return booking;
			} catch (e) {
				console.warn('Book trainer PG error:', e);
			}
		}

		const trainer = fallbackStore.trainers.find((t) => t.id === bookingData.trainerId);
		const fallbackBooking = {
			...booking,
			trainerName: trainer ? trainer.name : 'Coach'
		};
		fallbackStore.bookings.unshift(fallbackBooking as any);
		return fallbackBooking;
	},

	async getProfileData(userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const [userRecord] = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
				const [profileRecord] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
				const weightHistory = await db.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId)).orderBy(schema.weightLogs.date);
				return {
					user: userRecord || fallbackStore.user,
					profile: profileRecord || fallbackStore.profile,
					weightHistory: weightHistory.length > 0 ? weightHistory : fallbackStore.weightLogs
				};
			} catch (e) {
				console.warn('Profile data PG error:', e);
			}
		}
		const targetUser = fallbackStore.users.find((u) => u.id === userId) || fallbackStore.users[0];
		const targetProfile = fallbackStore.profiles[userId] || fallbackStore.profiles['user_alex_mercer'];
		const userWeightLogs = fallbackStore.weightLogs.filter((w) => w.userId === userId || w.userId === 'user_alex_mercer');
		return {
			user: targetUser,
			profile: targetProfile,
			weightHistory: userWeightLogs.length > 0 ? userWeightLogs : fallbackStore.weightLogs
		};
	},

	async updateProfile(updates: {
		heightCm?: number;
		currentWeightKg?: number;
		targetWeightKg?: number;
		bodyFatPercent?: number;
		muscleMassKg?: number;
		dailyCalorieTarget?: number;
		dailyWaterTargetMl?: number;
		fitnessLevel?: string;
	}, userId = 'user_alex_mercer') {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				await db.update(schema.profiles).set(updates).where(eq(schema.profiles.userId, userId));
			} catch (e) {
				console.warn('Update profile PG error:', e);
			}
		}

		if (!fallbackStore.profiles[userId]) {
			fallbackStore.profiles[userId] = { ...initialProfiles['user_alex_mercer'], userId };
		}
		Object.assign(fallbackStore.profiles[userId], updates);

		// Also add a new weight log entry if currentWeightKg changed
		if (updates.currentWeightKg) {
			const today = new Date().toISOString().split('T')[0];
			const newLog = {
				id: 'w_' + Math.random().toString(36).substring(2, 9),
				userId,
				weightKg: updates.currentWeightKg,
				bodyFatPercent: updates.bodyFatPercent || fallbackStore.profiles[userId].bodyFatPercent,
				muscleMassKg: updates.muscleMassKg || fallbackStore.profiles[userId].muscleMassKg,
				date: today,
				notes: 'Profile metric adjustment'
			};
			if (isPg) {
				try {
					await db.insert(schema.weightLogs).values(newLog);
				} catch (e) {}
			}
			fallbackStore.weightLogs.push(newLog);
		}
		return fallbackStore.profiles[userId];
	},

	// ----------------------------------------------------
	// Authentication & Session Management
	// ----------------------------------------------------
	getUserById(id: string) {
		return fallbackStore.users.find((u) => u.id === id) || null;
	},

	getUserByEmail(email: string) {
		return fallbackStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
	},

	async getAllUsers() {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const dbUsers = await db.select().from(schema.user);
				const dbProfiles = await db.select().from(schema.profiles);
				const dbChallenges = await db.select().from(schema.wakeUpChallenges);
				const dbSessions = await db.select().from(schema.session);

				return dbUsers.map((u) => {
					const prof = dbProfiles.find((p) => p.userId === u.id) || fallbackStore.profiles['user_alex_mercer'];
					const chal = dbChallenges.find((c) => c.userId === u.id) || fallbackStore.challenges['user_alex_mercer'];
					const userSessions = dbSessions.filter((s) => s.userId === u.id);
					return {
						id: u.id,
						name: u.name,
						email: u.email,
						role: u.role,
						image: u.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
						profile: prof,
						challenge: chal,
						sessionCount: userSessions.length
					};
				});
			} catch (e) {
				console.warn('getAllUsers PG error:', e);
			}
		}

		return fallbackStore.users.map((u) => {
			const prof = fallbackStore.profiles[u.id] || fallbackStore.profiles['user_alex_mercer'];
			const challenge = fallbackStore.challenges[u.id] || fallbackStore.challenges['user_alex_mercer'];
			const userSessions = fallbackStore.sessions.filter((s) => s.userId === u.id);
			return {
				id: u.id,
				name: u.name,
				email: u.email,
				role: u.role,
				image: u.image,
				profile: prof,
				challenge,
				sessionCount: userSessions.length
			};
		});
	},

	async getAllSessions() {
		const isPg = await checkPostgres();
		if (isPg) {
			try {
				const dbSessions = await db.select().from(schema.session);
				const dbUsers = await db.select().from(schema.user);
				return dbSessions.map((s) => {
					const u = dbUsers.find((user) => user.id === s.userId);
					return {
						id: s.id,
						token: s.token,
						userId: s.userId,
						userName: u?.name || 'Unknown User',
						userEmail: u?.email || 'unknown@fitdee.app',
						userRole: u?.role || 'user',
						createdAt: s.createdAt,
						expiresAt: s.expiresAt
					};
				});
			} catch (e) {
				console.warn('getAllSessions PG error:', e);
			}
		}

		return fallbackStore.sessions.map((s) => {
			const u = fallbackStore.users.find((user) => user.id === s.userId);
			return {
				id: s.id,
				token: s.token,
				userId: s.userId,
				userName: u?.name || 'Unknown User',
				userEmail: u?.email || 'unknown@fitdee.app',
				userRole: u?.role || 'user',
				createdAt: s.createdAt,
				expiresAt: s.expiresAt
			};
		});
	},

	async authenticate(email: string, password?: string) {
		const u = this.getUserByEmail(email);
		if (!u) {
			return { success: false, error: 'User with this email was not found.' };
		}
		if (password && u.password && u.password !== password) {
			return { success: false, error: 'Incorrect password credentials.' };
		}

		// Create session
		const sessionToken = 'fitdee_sess_' + Math.random().toString(36).substring(2, 15);
		const newSession = {
			id: 'sess_' + Math.random().toString(36).substring(2, 9),
			token: sessionToken,
			userId: u.id,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 30 * 86400000)
		};
		fallbackStore.sessions.push(newSession);

		return {
			success: true,
			user: u,
			session: newSession,
			token: sessionToken
		};
	},

	async register(userData: { name: string; email: string; password?: string; role?: string }) {
		const existing = this.getUserByEmail(userData.email);
		if (existing) {
			return { success: false, error: 'User with this email already exists.' };
		}

		const newUserId = 'user_' + Math.random().toString(36).substring(2, 9);
		const newUser = {
			id: newUserId,
			name: userData.name,
			email: userData.email,
			password: userData.password || 'password123',
			role: userData.role || 'user',
			image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
			emailVerified: true,
			createdAt: new Date()
		};

		fallbackStore.users.push(newUser);

		// Initialize profile
		fallbackStore.profiles[newUserId] = {
			id: 'profile_' + newUserId,
			userId: newUserId,
			heightCm: 178,
			currentWeightKg: 73.0,
			targetWeightKg: 70.0,
			bodyFatPercent: 15.0,
			muscleMassKg: 35.5,
			dailyCalorieTarget: 2300,
			dailyWaterTargetMl: 3000,
			fitnessLevel: 'New Athlete Protocol',
			activeTier: '1-Year Protocol'
		};

		// Initialize challenge
		fallbackStore.challenges[newUserId] = {
			id: 'wake_' + newUserId,
			userId: newUserId,
			targetTime: '06:30 AM',
			shakeTarget: 30,
			currentShakes: 0,
			isCompleted: false,
			date: new Date().toISOString().split('T')[0]
		};

		// Create session
		const sessionToken = 'fitdee_sess_' + Math.random().toString(36).substring(2, 15);
		const newSession = {
			id: 'sess_' + Math.random().toString(36).substring(2, 9),
			token: sessionToken,
			userId: newUserId,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 30 * 86400000)
		};
		fallbackStore.sessions.push(newSession);

		return {
			success: true,
			user: newUser,
			session: newSession,
			token: sessionToken
		};
	},

	async validateSession(token: string) {
		const s = fallbackStore.sessions.find((sess) => sess.token === token);
		if (!s) return null;
		if (new Date(s.expiresAt) < new Date()) {
			fallbackStore.sessions = fallbackStore.sessions.filter((sess) => sess.token !== token);
			return null;
		}
		const user = this.getUserById(s.userId);
		if (!user) return null;
		return { user, session: s };
	},

	async deleteSession(token: string) {
		fallbackStore.sessions = fallbackStore.sessions.filter((s) => s.token !== token);
		return true;
	},

	// ----------------------------------------------------
	// Notification Dispatcher
	// ----------------------------------------------------
	async getNotifications(userId: string) {
		return fallbackStore.notifications
			.filter((n) => n.userId === userId || n.userId === 'all')
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	},

	async createNotification(notif: { userId?: string; title: string; message: string; type?: string }) {
		const id = 'notif_' + Math.random().toString(36).substring(2, 9);
		const newNotif = {
			id,
			userId: notif.userId || 'all',
			title: notif.title,
			message: notif.message,
			type: notif.type || 'info',
			isRead: false,
			createdAt: new Date()
		};
		fallbackStore.notifications.unshift(newNotif);
		return newNotif;
	},

	async markNotificationRead(id: string) {
		const notif = fallbackStore.notifications.find((n) => n.id === id);
		if (notif) {
			notif.isRead = true;
		}
		return true;
	},

	async clearNotifications(userId: string) {
		fallbackStore.notifications = fallbackStore.notifications.filter(
			(n) => (n.userId !== userId && n.userId !== 'all') || !n.isRead
		);
		return true;
	},

	// ----------------------------------------------------
	// Admin Diagnostic & Live State Modifier
	// ----------------------------------------------------
	async adminUpdateUserData(targetUserId: string, updates: any) {
		const user = this.getUserById(targetUserId);
		if (!user) return { success: false, error: 'User target not found' };

		if (updates.name) user.name = updates.name;
		if (updates.email) user.email = updates.email;
		if (updates.role) user.role = updates.role;

		// Ensure profile exists
		if (!fallbackStore.profiles[targetUserId]) {
			fallbackStore.profiles[targetUserId] = { ...initialProfiles['user_alex_mercer'], userId: targetUserId };
		}
		const prof = fallbackStore.profiles[targetUserId];

		if (updates.weightKg !== undefined && updates.weightKg !== null) {
			const w = Number(updates.weightKg);
			prof.currentWeightKg = w;
			const newLog = {
				id: 'w_' + Math.random().toString(36).substring(2, 9),
				userId: targetUserId,
				weightKg: w,
				bodyFatPercent: updates.bodyFatPercent !== undefined ? Number(updates.bodyFatPercent) : prof.bodyFatPercent,
				muscleMassKg: prof.muscleMassKg,
				date: new Date().toISOString().split('T')[0],
				notes: 'Diagnostic Admin Telemetry Override'
			};
			fallbackStore.weightLogs.push(newLog);
		}
		if (updates.targetWeightKg !== undefined) prof.targetWeightKg = Number(updates.targetWeightKg);
		if (updates.bodyFatPercent !== undefined) prof.bodyFatPercent = Number(updates.bodyFatPercent);
		if (updates.muscleMassKg !== undefined) prof.muscleMassKg = Number(updates.muscleMassKg);
		if (updates.dailyCalorieTarget !== undefined) prof.dailyCalorieTarget = Number(updates.dailyCalorieTarget);
		if (updates.dailyWaterTargetMl !== undefined) prof.dailyWaterTargetMl = Number(updates.dailyWaterTargetMl);
		if (updates.fitnessLevel !== undefined) prof.fitnessLevel = updates.fitnessLevel;

		// Ensure challenge exists
		if (!fallbackStore.challenges[targetUserId]) {
			fallbackStore.challenges[targetUserId] = { ...initialChallenges['user_alex_mercer'], userId: targetUserId };
		}
		const challenge = fallbackStore.challenges[targetUserId];
		if (updates.currentShakes !== undefined) challenge.currentShakes = Number(updates.currentShakes);
		if (updates.shakeTarget !== undefined) challenge.shakeTarget = Number(updates.shakeTarget);
		challenge.isCompleted = challenge.currentShakes >= challenge.shakeTarget;

		// Water adjustment
		if (updates.waterMl !== undefined && Number(updates.waterMl) > 0) {
			const today = new Date().toISOString().split('T')[0];
			fallbackStore.waterLogs.push({
				id: 'wt_' + Math.random().toString(36).substring(2, 9),
				userId: targetUserId,
				amountMl: Number(updates.waterMl),
				date: today
			});
		}

		return {
			success: true,
			user,
			profile: prof,
			challenge
		};
	}
};
