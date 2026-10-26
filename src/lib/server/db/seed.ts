import { client, db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
	console.log('--- Initializing database tables & seed data ---');

	// Create tables if not exists
	await client.unsafe(`
		CREATE TABLE IF NOT EXISTS "user" (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			email_verified BOOLEAN NOT NULL DEFAULT false,
			image TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "session" (
			id TEXT PRIMARY KEY,
			expires_at TIMESTAMP NOT NULL,
			token TEXT NOT NULL UNIQUE,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now(),
			ip_address TEXT,
			user_agent TEXT,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS "account" (
			id TEXT PRIMARY KEY,
			account_id TEXT NOT NULL,
			provider_id TEXT NOT NULL,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			access_token TEXT,
			refresh_token TEXT,
			id_token TEXT,
			access_token_expires_at TIMESTAMP,
			refresh_token_expires_at TIMESTAMP,
			scope TEXT,
			password TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "verification" (
			id TEXT PRIMARY KEY,
			identifier TEXT NOT NULL,
			value TEXT NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "profiles" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
			height_cm REAL NOT NULL DEFAULT 178,
			current_weight_kg REAL NOT NULL DEFAULT 74.5,
			target_weight_kg REAL NOT NULL DEFAULT 72.0,
			body_fat_percent REAL NOT NULL DEFAULT 14.8,
			muscle_mass_kg REAL NOT NULL DEFAULT 36.2,
			daily_calorie_target INTEGER NOT NULL DEFAULT 2400,
			daily_water_target_ml INTEGER NOT NULL DEFAULT 3000,
			fitness_level TEXT NOT NULL DEFAULT 'Intermediate',
			active_tier TEXT NOT NULL DEFAULT '1-Year Protocol',
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "weight_logs" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			weight_kg REAL NOT NULL,
			body_fat_percent REAL,
			muscle_mass_kg REAL,
			date TEXT NOT NULL,
			notes TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "routines" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			duration_minutes INTEGER NOT NULL DEFAULT 45,
			scheduled_time TEXT NOT NULL DEFAULT '05:30 PM',
			is_completed BOOLEAN NOT NULL DEFAULT false,
			date TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS "exercises" (
			id TEXT PRIMARY KEY,
			routine_id TEXT NOT NULL REFERENCES "routines"(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			target_area TEXT NOT NULL,
			sets INTEGER NOT NULL DEFAULT 3,
			reps INTEGER NOT NULL DEFAULT 10,
			weight_kg REAL NOT NULL DEFAULT 0,
			completed_sets INTEGER NOT NULL DEFAULT 0,
			is_done BOOLEAN NOT NULL DEFAULT false
		);

		CREATE TABLE IF NOT EXISTS "wake_up_challenges" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			target_time TEXT NOT NULL DEFAULT '06:30 AM',
			shake_target INTEGER NOT NULL DEFAULT 30,
			current_shakes INTEGER NOT NULL DEFAULT 18,
			is_completed BOOLEAN NOT NULL DEFAULT false,
			date TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS "water_logs" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			amount_ml INTEGER NOT NULL DEFAULT 250,
			date TEXT NOT NULL,
			logged_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "meal_logs" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			meal_type TEXT NOT NULL,
			food_name TEXT NOT NULL,
			calories INTEGER NOT NULL,
			protein_grams REAL NOT NULL DEFAULT 0,
			carbs_grams REAL NOT NULL DEFAULT 0,
			fat_grams REAL NOT NULL DEFAULT 0,
			image_url TEXT,
			notes TEXT,
			date TEXT NOT NULL,
			logged_at TIMESTAMP NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS "trainers" (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			role_title TEXT NOT NULL,
			specialty TEXT NOT NULL,
			rating REAL NOT NULL DEFAULT 4.9,
			review_count INTEGER NOT NULL DEFAULT 120,
			hourly_rate_usd INTEGER NOT NULL DEFAULT 65,
			experience_years INTEGER NOT NULL DEFAULT 6,
			bio TEXT NOT NULL,
			avatarUrl TEXT NOT NULL,
			location TEXT NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT true
		);

		CREATE TABLE IF NOT EXISTS "gyms" (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			location TEXT NOT NULL,
			rating REAL NOT NULL DEFAULT 4.8,
			member_count INTEGER NOT NULL DEFAULT 450,
			image_url TEXT NOT NULL,
			facilities TEXT NOT NULL,
			monthly_rate_usd INTEGER NOT NULL DEFAULT 89
		);

		CREATE TABLE IF NOT EXISTS "trainer_bookings" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			trainer_id TEXT NOT NULL REFERENCES "trainers"(id) ON DELETE CASCADE,
			date TEXT NOT NULL,
			time_slot TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'confirmed',
			notes TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now()
		);
	`);

	const today = new Date().toISOString().split('T')[0];

	// Check if default user exists
	const existingUser = await db.select().from(schema.user).where(eq(schema.user.email, 'alex@fitdee.app')).limit(1);
	
	let userId = 'user_alex_mercer';
	if (existingUser.length === 0) {
		console.log('Seeding demo user & profile...');
		await db.insert(schema.user).values({
			id: userId,
			name: 'Alex Mercer',
			email: 'alex@fitdee.app',
			emailVerified: true,
			image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
		});

		await db.insert(schema.profiles).values({
			id: 'profile_' + userId,
			userId,
			heightCm: 182,
			currentWeightKg: 74.5,
			targetWeightKg: 72.0,
			bodyFatPercent: 14.8,
			muscleMassKg: 36.2,
			dailyCalorieTarget: 2400,
			dailyWaterTargetMl: 3000,
			fitnessLevel: 'Hypertrophy Focus',
			activeTier: '1-Year Protocol'
		});

		// Weight history logs
		const pastDates = [
			{ date: '2026-10-02', weight: 76.5, fat: 15.6, muscle: 35.8 },
			{ date: '2026-10-06', weight: 75.9, fat: 15.3, muscle: 36.0 },
			{ date: '2026-10-10', weight: 75.2, fat: 15.0, muscle: 36.1 },
			{ date: today, weight: 74.5, fat: 14.8, muscle: 36.2 }
		];

		for (const w of pastDates) {
			await db.insert(schema.weightLogs).values({
				id: 'wlog_' + Math.random().toString(36).substring(2, 9),
				userId,
				weightKg: w.weight,
				bodyFatPercent: w.fat,
				muscleMassKg: w.muscle,
				date: w.date,
				notes: 'Morning weigh-in'
			});
		}
	} else {
		userId = existingUser[0].id;
	}

	// Seed routine and exercises for today
	const existingRoutine = await db.select().from(schema.routines).where(eq(schema.routines.userId, userId)).limit(1);
	if (existingRoutine.length === 0) {
		console.log('Seeding workouts...');
		const routineId = 'routine_today_' + userId;
		await db.insert(schema.routines).values({
			id: routineId,
			userId,
			name: 'Hypertrophy Block A',
			category: 'Chest & Triceps',
			durationMinutes: 45,
			scheduledTime: '05:30 PM',
			isCompleted: false,
			date: today
		});

		await db.insert(schema.exercises).values([
			{
				id: 'ex_1',
				routineId,
				name: 'Barbell Bench Press',
				targetArea: 'Mid Chest',
				sets: 4,
				reps: 10,
				weightKg: 70,
				completedSets: 4,
				isDone: true
			},
			{
				id: 'ex_2',
				routineId,
				name: 'Incline Dumbbell Flyes',
				targetArea: 'Upper Chest',
				sets: 3,
				reps: 12,
				weightKg: 16,
				completedSets: 0,
				isDone: false
			},
			{
				id: 'ex_3',
				routineId,
				name: 'Triceps Rope Pushdown',
				targetArea: 'Triceps Long Head',
				sets: 4,
				reps: 15,
				weightKg: 22,
				completedSets: 0,
				isDone: false
			}
		]);

		// Seed wake-up challenge
		await db.insert(schema.wakeUpChallenges).values({
			id: 'wake_' + userId,
			userId,
			targetTime: '06:30 AM',
			shakeTarget: 30,
			currentShakes: 18,
			isCompleted: false,
			date: today
		});

		// Seed water logs
		await db.insert(schema.waterLogs).values([
			{ id: 'water_1', userId, amountMl: 500, date: today },
			{ id: 'water_2', userId, amountMl: 500, date: today },
			{ id: 'water_3', userId, amountMl: 750, date: today }
		]);

		// Seed meal logs
		await db.insert(schema.mealLogs).values([
			{
				id: 'meal_1',
				userId,
				mealType: 'breakfast',
				foodName: 'Avocado Sourdough Toast & Poached Eggs',
				calories: 480,
				proteinGrams: 24,
				carbsGrams: 42,
				fatGrams: 22,
				date: today,
				notes: 'Pre-workout carbs & healthy fats'
			},
			{
				id: 'meal_2',
				userId,
				mealType: 'lunch',
				foodName: 'Grilled Chicken Breast & Mediterranean Quinoa',
				calories: 650,
				proteinGrams: 52,
				carbsGrams: 58,
				fatGrams: 18,
				date: today,
				notes: 'High protein recovery bowl'
			},
			{
				id: 'meal_3',
				userId,
				mealType: 'snack',
				foodName: 'Whey Isolate Shake with Berries',
				calories: 220,
				proteinGrams: 32,
				carbsGrams: 14,
				fatGrams: 3,
				date: today,
				notes: 'Post workout shake'
			}
		]);
	}

	// Seed trainers & gyms
	const existingTrainers = await db.select().from(schema.trainers).limit(1);
	if (existingTrainers.length === 0) {
		console.log('Seeding trainers & gyms...');
		await db.insert(schema.trainers).values([
			{
				id: 'tr_1',
				name: 'Marcus Vance',
				roleTitle: 'Elite Biomechanics & Strength Coach',
				specialty: 'Hypertrophy & Movement Symmetry',
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
				roleTitle: 'Olympic Weightlifting & Mobility Coach',
				specialty: 'Clean & Jerk, Snatch, Hip Deceleration',
				rating: 4.9,
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
				specialty: 'High-Velocity Conditioning & Bodyweight Mastery',
				rating: 4.88,
				reviewCount: 115,
				hourlyRateUsd: 65,
				experienceYears: 6,
				bio: 'Passionate about athletic durability, VO2 max optimization, and biomechanical feedback.',
				avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
				location: 'Pulse Kinetic Studio, Midtown',
				isVerified: true
			}
		]);

		await db.insert(schema.gyms).values([
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
		]);
	}

	console.log('--- Database seeding complete! ---');
}
