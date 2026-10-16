import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://fitdee:fitdeepassword@localhost:5432/fitdee_db';

// Create the connection client
export const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
	onnotice: () => {}
});

export const db = drizzle(client, { schema });
export { schema };
