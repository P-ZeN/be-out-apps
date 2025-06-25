import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/setup-tables", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await client.query(`
            DROP TABLE IF EXISTS users CASCADE;
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                provider VARCHAR(50) NOT NULL DEFAULT 'email',
                provider_id VARCHAR(255),
                role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'producer')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT users_provider_provider_id_key UNIQUE (provider, provider_id)
            );
        `);

        await client.query(`
            DROP TABLE IF EXISTS user_profiles CASCADE;
            CREATE TABLE user_profiles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                bio TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        res.send("Tables created successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating tables");
    } finally {
        client.release();
    }
});

export default router;
