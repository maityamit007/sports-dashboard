import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

if (!process.env.DB_URL) {
    throw new Error('DB_URL not defined');
}

export const pool = new pg.Pool({
    connectionString: process.env.DB_URL
});

export const db = drizzle(pool);