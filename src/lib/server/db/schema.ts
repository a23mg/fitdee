import { pgTable, text, timestamp, boolean, integer, real, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// Better-Auth Core Tables
// ----------------------------------------------------
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ----------------------------------------------------
// User Profile & Body Metrics
// ----------------------------------------------------
export const profiles = pgTable('profiles', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
	heightCm: real('height_cm').default(178).notNull(),
	currentWeightKg: real('current_weight_kg').default(74.5).notNull(),
	targetWeightKg: real('target_weight_kg').default(72.0).notNull(),
	bodyFatPercent: real('body_fat_percent').default(14.8).notNull(),
	muscleMassKg: real('muscle_mass_kg').default(36.2).notNull(),
	dailyCalorieTarget: integer('daily_calorie_target').default(2400).notNull(),
	dailyWaterTargetMl: integer('daily_water_target_ml').default(3000).notNull(),
	fitnessLevel: text('fitness_level').default('Intermediate').notNull(),
	activeTier: text('active_tier').default('1-Year Protocol').notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const weightLogs = pgTable('weight_logs', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	weightKg: real('weight_kg').notNull(),
	bodyFatPercent: real('body_fat_percent'),
	muscleMassKg: real('muscle_mass_kg'),
	date: text('date').notNull(), // YYYY-MM-DD
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ----------------------------------------------------
// Workouts, Exercises, and Wake-Up Challenge
// ----------------------------------------------------
export const routines = pgTable('routines', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	category: text('category').notNull(),
	durationMinutes: integer('duration_minutes').default(45).notNull(),
	scheduledTime: text('scheduled_time').default('05:30 PM').notNull(),
	isCompleted: boolean('is_completed').default(false).notNull(),
	date: text('date').notNull() // YYYY-MM-DD
});

export const exercises = pgTable('exercises', {
	id: text('id').primaryKey(),
	routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	targetArea: text('target_area').notNull(),
	sets: integer('sets').default(3).notNull(),
	reps: integer('reps').default(10).notNull(),
	weightKg: real('weight_kg').default(0).notNull(),
	completedSets: integer('completed_sets').default(0).notNull(),
	isDone: boolean('is_done').default(false).notNull()
});

export const wakeUpChallenges = pgTable('wake_up_challenges', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	targetTime: text('target_time').default('06:30 AM').notNull(),
	shakeTarget: integer('shake_target').default(30).notNull(),
	currentShakes: integer('current_shakes').default(0).notNull(),
	isCompleted: boolean('is_completed').default(false).notNull(),
	date: text('date').notNull() // YYYY-MM-DD
});

// ----------------------------------------------------
// Nutrition & Hydration
// ----------------------------------------------------
export const waterLogs = pgTable('water_logs', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	amountMl: integer('amount_ml').default(250).notNull(),
	date: text('date').notNull(), // YYYY-MM-DD
	loggedAt: timestamp('logged_at').defaultNow().notNull()
});

export const mealLogs = pgTable('meal_logs', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	mealType: text('meal_type').notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
	foodName: text('food_name').notNull(),
	calories: integer('calories').notNull(),
	proteinGrams: real('protein_grams').default(0).notNull(),
	carbsGrams: real('carbs_grams').default(0).notNull(),
	fatGrams: real('fat_grams').default(0).notNull(),
	imageUrl: text('image_url'),
	notes: text('notes'),
	date: text('date').notNull(), // YYYY-MM-DD
	loggedAt: timestamp('logged_at').defaultNow().notNull()
});

// ----------------------------------------------------
// Trainers, Gyms & Bookings
// ----------------------------------------------------
export const trainers = pgTable('trainers', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	roleTitle: text('role_title').notNull(),
	specialty: text('specialty').notNull(),
	rating: real('rating').default(4.9).notNull(),
	reviewCount: integer('review_count').default(120).notNull(),
	hourlyRateUsd: integer('hourly_rate_usd').default(65).notNull(),
	experienceYears: integer('experience_years').default(6).notNull(),
	bio: text('bio').notNull(),
	avatarUrl: text('avatar_url').notNull(),
	location: text('location').notNull(),
	isVerified: boolean('is_verified').default(true).notNull()
});

export const gyms = pgTable('gyms', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	location: text('location').notNull(),
	rating: real('rating').default(4.8).notNull(),
	memberCount: integer('member_count').default(450).notNull(),
	imageUrl: text('image_url').notNull(),
	facilities: text('facilities').notNull(),
	monthlyRateUsd: integer('monthly_rate_usd').default(89).notNull()
});

export const trainerBookings = pgTable('trainer_bookings', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	trainerId: text('trainer_id').notNull().references(() => trainers.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	timeSlot: text('time_slot').notNull(), // e.g. "09:00 AM - 10:00 AM"
	status: text('status').default('confirmed').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const userRelations = relations(user, ({ one, many }) => ({
	profile: one(profiles, { fields: [user.id], references: [profiles.userId] }),
	weightLogs: many(weightLogs),
	routines: many(routines),
	waterLogs: many(waterLogs),
	mealLogs: many(mealLogs),
	trainerBookings: many(trainerBookings)
}));

export const routineRelations = relations(routines, ({ one, many }) => ({
	user: one(user, { fields: [routines.userId], references: [user.id] }),
	exercises: many(exercises)
}));

export const exerciseRelations = relations(exercises, ({ one }) => ({
	routine: one(routines, { fields: [exercises.routineId], references: [routines.id] })
}));

export const trainerRelations = relations(trainers, ({ many }) => ({
	bookings: many(trainerBookings)
}));

export const trainerBookingRelations = relations(trainerBookings, ({ one }) => ({
	user: one(user, { fields: [trainerBookings.userId], references: [user.id] }),
	trainer: one(trainers, { fields: [trainerBookings.trainerId], references: [trainers.id] })
}));
