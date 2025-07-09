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
                    u.onboarding_complete,
                    up.first_name,
                    up.last_name,
                    up.phone,
                    up.date_of_birth,
                    up.street_number,
                    up.street_name,
                    up.postal_code,
                    up.city,
                    up.country,
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

// Complete onboarding endpoint
router.post("/complete-onboarding", authenticateToken, async (req, res) => {
    const { firstName, lastName, phone, dateOfBirth, streetNumber, streetName, postalCode, city, country } = req.body;

    // Validate required fields
    if (
        !firstName ||
        !lastName ||
        !phone ||
        !dateOfBirth ||
        !streetNumber ||
        !streetName ||
        !postalCode ||
        !city ||
        !country
    ) {
        return res.status(400).json({
            error: "All fields are required for onboarding completion",
        });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const userId = req.user.userId || req.user.id;

            // Check if profile exists
            const checkResult = await client.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [userId]);

            if (checkResult.rows.length === 0) {
                // Create new profile with all onboarding data
                await client.query(
                    `INSERT INTO user_profiles
                    (user_id, first_name, last_name, phone, date_of_birth, street_number, street_name, postal_code, city, country, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                    [
                        userId,
                        firstName,
                        lastName,
                        phone,
                        dateOfBirth,
                        streetNumber,
                        streetName,
                        postalCode,
                        city,
                        country,
                    ]
                );
            } else {
                // Update existing profile with all onboarding data
                await client.query(
                    `UPDATE user_profiles
                    SET first_name = $2, last_name = $3, phone = $4, date_of_birth = $5,
                        street_number = $6, street_name = $7, postal_code = $8, city = $9, country = $10, updated_at = NOW()
                    WHERE user_id = $1`,
                    [
                        userId,
                        firstName,
                        lastName,
                        phone,
                        dateOfBirth,
                        streetNumber,
                        streetName,
                        postalCode,
                        city,
                        country,
                    ]
                );
            }

            // Mark onboarding as complete
            await client.query("UPDATE users SET onboarding_complete = true WHERE id = $1", [userId]);

            await client.query("COMMIT");

            res.json({
                success: true,
                message: "Onboarding completed successfully",
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Onboarding completion error:", err);
        res.status(500).json({ error: "Error completing onboarding" });
    }
});

// Note: Profile updates are now handled through the onboarding completion process
// Users complete their profile during onboarding, and updates should be handled through support
// This endpoint is kept for backwards compatibility but bio field has been removed

router.put("/profile", authenticateToken, async (req, res) => {
    const { first_name, last_name } = req.body;
    try {
        const client = await pool.connect();
        try {
            // First check if profile exists
            const checkResult = await client.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [
                req.user.userId,
            ]);

            let result;
            if (checkResult.rows.length === 0) {
                // Create new profile (minimal - should not happen with new onboarding flow)
                result = await client.query(
                    "INSERT INTO user_profiles (user_id, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
                    [req.user.userId, first_name, last_name]
                );
            } else {
                // Update existing profile (only basic fields)
                result = await client.query(
                    "UPDATE user_profiles SET first_name = $1, last_name = $2, updated_at = NOW() WHERE user_id = $3 RETURNING *",
                    [first_name, last_name, req.user.userId]
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
