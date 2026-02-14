import 'dotenv/config';

if (!process.env.DB_URL) {
    throw new Error('DB_URL not defined');
}

export default defineConfig = {
    schema: './src/db/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DB_URL
    }
}
