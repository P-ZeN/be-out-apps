import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        //console.log("Profile request - req.user:", req.user); // Debug log

        const client = await pool.connect();
        try {
            const userId = req.user.userId || req.user.id; // Try both field names
            //console.log("Looking for user with ID:", userId); // Debug log

            const result = await client.query(
                `
                SELECT
                    u.id,
                    u.email,
                    u.role,
                    u.is_active,
                    u.created_at,
                    up.first_name,
                    up.last_name,
                    up.bio,
                    up.profile_picture
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = $1
            `,
                [userId]
            );

            // console.log("Query result:", result.rows); // Debug log

            const userProfile = result.rows[0];
            if (!userProfile) {
                //console.log("No user found with ID:", userId); // Debug log
                return res.status(404).json({ error: "Profile not found" });
            }
            res.json(userProfile);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Profile endpoint error:", err);
        res.status(500).json({ error: "Error fetching profile" });
    }
});

router.put("/profile", authenticateToken, async (req, res) => {
    const { first_name, last_name, bio } = req.body;
    try {
        const client = await pool.connect();
        try {
            // First check if profile exists
            const checkResult = await client.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [
                req.user.userId,
            ]);

            let result;
            if (checkResult.rows.length === 0) {
                // Create new profile
                result = await client.query(
                    "INSERT INTO user_profiles (user_id, first_name, last_name, bio, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
                    [req.user.userId, first_name, last_name, bio]
                );
            } else {
                // Update existing profile
                result = await client.query(
                    "UPDATE user_profiles SET first_name = $1, last_name = $2, bio = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *",
                    [first_name, last_name, bio, req.user.userId]
                );
            }
            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating profile" });
    }
});

export default router;
