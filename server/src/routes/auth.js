import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

// Register route
router.post("/register", async (req, res) => {
    const { email, password, firstName, lastName, bio } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const userResult = await client.query(
                "INSERT INTO users (email, password, provider) VALUES ($1, $2, 'email') RETURNING id, email",
                [email, hashedPassword]
            );
            const user = userResult.rows[0];

            await client.query(
                "INSERT INTO user_profiles (user_id, first_name, last_name, bio) VALUES ($1, $2, $3, $4)",
                [user.id, firstName, lastName, bio]
            );

            await client.query("COMMIT");

            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(201).send({ token, email: user.email });
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err);
            if (err.code === "23505") {
                // Unique violation
                return res.status(409).send("User with this email already exists");
            }
            res.status(500).send("Error registering user");
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user");
    }
});

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required");
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM users WHERE email = $1 AND provider = 'email'", [email]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).send("Invalid credentials");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).send("Invalid credentials");
            }

            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.send({ token });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in");
    }
});

export default router;
