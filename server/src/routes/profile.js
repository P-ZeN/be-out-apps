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
                    up.date_of_birth::text as date_of_birth,
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
    const { firstName, lastName, phone, dateOfBirth, preferred_language } = req.body;

    // Validate required fields (addresses are now handled separately)
    if (!firstName || !lastName || !phone || !dateOfBirth) {
        return res.status(400).json({
            error: "Personal information fields (firstName, lastName, phone, dateOfBirth) are required for onboarding completion",
        });
    }

    // Validate language code if provided
    const validLanguages = ['fr', 'en', 'es'];
    const languageToSave = preferred_language && validLanguages.includes(preferred_language) 
        ? preferred_language 
        : 'fr'; // Default to French if not provided or invalid

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const userId = req.user.userId || req.user.id;

            // Check if profile exists
            const checkResult = await client.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [userId]);

            if (checkResult.rows.length === 0) {
                // Create new profile with personal information only (addresses handled separately)
                await client.query(
                    `INSERT INTO user_profiles
                    (user_id, first_name, last_name, phone, date_of_birth, preferred_language, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                    [userId, firstName, lastName, phone, dateOfBirth, languageToSave]
                );
            } else {
                // Update existing profile with personal information only (addresses handled separately)
                await client.query(
                    `UPDATE user_profiles
                    SET first_name = $2, last_name = $3, phone = $4, date_of_birth = $5, preferred_language = $6, updated_at = NOW()
                    WHERE user_id = $1`,
                    [userId, firstName, lastName, phone, dateOfBirth, languageToSave]
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

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
    const { first_name, last_name, phone, date_of_birth, street_number, street_name, postal_code, city, country } =
        req.body;

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
                    `INSERT INTO user_profiles (user_id, first_name, last_name, phone, date_of_birth,
                     street_number, street_name, postal_code, city, country, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                     RETURNING *, date_of_birth::text as date_of_birth`,
                    [
                        req.user.userId,
                        first_name,
                        last_name,
                        phone,
                        date_of_birth,
                        street_number,
                        street_name,
                        postal_code,
                        city,
                        country,
                    ]
                );
            } else {
                // Update existing profile
                result = await client.query(
                    `UPDATE user_profiles SET
                     first_name = $1, last_name = $2, phone = $3, date_of_birth = $4,
                     street_number = $5, street_name = $6, postal_code = $7, city = $8, country = $9,
                     updated_at = NOW()
                     WHERE user_id = $10 RETURNING *, date_of_birth::text as date_of_birth`,
                    [
                        first_name,
                        last_name,
                        phone,
                        date_of_birth,
                        street_number,
                        street_name,
                        postal_code,
                        city,
                        country,
                        req.user.userId,
                    ]
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

// Update user language preference
router.put("/language-preference", authenticateToken, async (req, res) => {
    const { preferred_language } = req.body;

    // Validate language code
    const validLanguages = ['fr', 'en', 'es'];
    if (!preferred_language || !validLanguages.includes(preferred_language)) {
        return res.status(400).json({ 
            error: "Invalid language code. Supported languages: fr, en, es" 
        });
    }

    try {
        const client = await pool.connect();
        try {
            const userId = req.user.userId || req.user.id;

            // Check if profile exists
            const checkResult = await client.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [userId]);

            if (checkResult.rows.length === 0) {
                // Create profile if it doesn't exist
                await client.query(
                    "INSERT INTO user_profiles (user_id, preferred_language, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())",
                    [userId, preferred_language]
                );
            } else {
                // Update existing profile
                await client.query(
                    "UPDATE user_profiles SET preferred_language = $1, updated_at = NOW() WHERE user_id = $2",
                    [preferred_language, userId]
                );
            }

            res.json({ 
                message: "Language preference updated successfully",
                preferred_language 
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating language preference:", error);
        res.status(500).json({ error: "Failed to update language preference" });
    }
});

export default router;
