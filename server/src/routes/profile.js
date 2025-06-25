import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT first_name, last_name, bio FROM user_profiles WHERE user_id = $1",
                [req.user.userId]
            );
            const profile = result.rows[0];
            if (!profile) {
                return res.status(404).send("Profile not found");
            }
            res.send(profile);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching profile");
    }
});

router.put("/profile", authenticateToken, async (req, res) => {
    const { first_name, last_name, bio } = req.body;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                "UPDATE user_profiles SET first_name = $1, last_name = $2, bio = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *",
                [first_name, last_name, bio, req.user.userId]
            );
            res.send(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating profile");
    }
});

export default router;
