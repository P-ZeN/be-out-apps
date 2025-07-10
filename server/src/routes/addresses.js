import express from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// Get all addresses for a user
router.get("/users/:userId/addresses", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId || req.user.id;

        // Check if user can access this data (must be their own data or admin)
        if (currentUserId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const query = `
            SELECT
                a.*,
                ar.relationship_type,
                ar.is_active,
                ar.created_at as relationship_created_at
            FROM addresses a
            JOIN address_relationships ar ON a.id = ar.address_id
            WHERE ar.entity_type = 'user'
            AND ar.entity_id = $1
            AND ar.is_active = true
            ORDER BY a.is_primary DESC, a.created_at DESC
        `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user addresses:", error);
        res.status(500).json({ error: "Failed to fetch addresses" });
    }
});

// Get user's primary address
router.get("/users/:userId/primary-address", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId || req.user.id;

        // Check if user can access this data (must be their own data or admin)
        if (currentUserId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const query = `
            SELECT
                a.*,
                ar.relationship_type,
                ar.is_active,
                ar.created_at as relationship_created_at
            FROM addresses a
            JOIN address_relationships ar ON a.id = ar.address_id
            WHERE ar.entity_type = 'user'
            AND ar.entity_id = $1
            AND ar.relationship_type = 'primary'
            AND ar.is_active = true
            ORDER BY a.created_at DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No primary address found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user primary address:", error);
        res.status(500).json({ error: "Failed to fetch primary address" });
    }
});

// Create a new address
router.post("/addresses", authenticateToken, async (req, res) => {
    try {
        const {
            address_line_1,
            address_line_2,
            locality,
            administrative_area,
            postal_code,
            country_code,
            address_type,
            label,
            is_primary,
            latitude,
            longitude,
        } = req.body;

        // Validate required fields
        if (!address_line_1 || !locality || !country_code) {
            return res.status(400).json({
                error: "Missing required fields: address_line_1, locality, country_code",
            });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const currentUserId = req.user.userId || req.user.id;

            // If this is being set as primary, unset other primary addresses for this user
            if (is_primary) {
                const updateQuery = `
                    UPDATE addresses
                    SET is_primary = false
                    WHERE id IN (
                        SELECT a.id
                        FROM addresses a
                        JOIN address_relationships ar ON a.id = ar.address_id
                        WHERE ar.entity_type = 'user'
                        AND ar.entity_id = $1
                        AND ar.is_active = true
                    )
                `;
                await client.query(updateQuery, [currentUserId]);
            }

            // Create the address
            const addressQuery = `
                INSERT INTO addresses (
                    address_line_1, address_line_2, locality, administrative_area,
                    postal_code, country_code, address_type, label, is_primary,
                    latitude, longitude, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING *
            `;

            const addressResult = await client.query(addressQuery, [
                address_line_1,
                address_line_2,
                locality,
                administrative_area,
                postal_code,
                country_code,
                address_type || "home",
                label || "Home Address",
                is_primary || false,
                latitude,
                longitude,
            ]);

            const newAddress = addressResult.rows[0];

            await client.query("COMMIT");
            res.status(201).json(newAddress);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating address:", error);
        res.status(500).json({ error: "Failed to create address" });
    }
});

// Create address relationship
router.post("/address-relationships", authenticateToken, async (req, res) => {
    try {
        const { address_id, entity_type, entity_id, relationship_type } = req.body;

        const currentUserId = req.user.userId || req.user.id;

        // Validate required fields
        if (!address_id || !entity_type || !entity_id) {
            return res.status(400).json({
                error: "Missing required fields: address_id, entity_type, entity_id",
            });
        }

        // Check if user can create this relationship
        if (entity_type === "user" && entity_id !== currentUserId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const finalRelationshipType = relationship_type || "primary";

        // If this is a primary relationship, deactivate any existing primary relationship
        if (finalRelationshipType === "primary") {
            await pool.query(
                `
                UPDATE address_relationships
                SET is_active = false
                WHERE entity_type = $1 AND entity_id = $2 AND relationship_type = 'primary' AND is_active = true
            `,
                [entity_type, entity_id]
            );
        }

        // Check if this exact relationship already exists
        const existingQuery = `
            SELECT * FROM address_relationships
            WHERE address_id = $1 AND entity_type = $2 AND entity_id = $3 AND relationship_type = $4
        `;
        const existingResult = await pool.query(existingQuery, [
            address_id,
            entity_type,
            entity_id,
            finalRelationshipType,
        ]);

        let result;
        if (existingResult.rows.length > 0) {
            // Update existing relationship to be active
            const updateQuery = `
                UPDATE address_relationships
                SET is_active = true
                WHERE address_id = $1 AND entity_type = $2 AND entity_id = $3 AND relationship_type = $4
                RETURNING *
            `;
            result = await pool.query(updateQuery, [address_id, entity_type, entity_id, finalRelationshipType]);
        } else {
            // Insert new relationship
            const insertQuery = `
                INSERT INTO address_relationships (
                    address_id, entity_type, entity_id, relationship_type, is_active, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *
            `;
            result = await pool.query(insertQuery, [address_id, entity_type, entity_id, finalRelationshipType, true]);
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating address relationship:", error);
        res.status(500).json({ error: "Failed to create address relationship" });
    }
});

// Update an address
router.put("/addresses/:addressId", authenticateToken, async (req, res) => {
    try {
        const { addressId } = req.params;
        const {
            address_line_1,
            address_line_2,
            locality,
            administrative_area,
            postal_code,
            country_code,
            address_type,
            label,
            is_primary,
            latitude,
            longitude,
        } = req.body;

        const currentUserId = req.user.userId || req.user.id;

        // Check if user can update this address
        const checkQuery = `
            SELECT a.*
            FROM addresses a
            JOIN address_relationships ar ON a.id = ar.address_id
            WHERE a.id = $1
            AND ar.entity_type = 'user'
            AND ar.entity_id = $2
            AND ar.is_active = true
        `;

        const checkResult = await pool.query(checkQuery, [addressId, currentUserId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Address not found or access denied" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // If this is being set as primary, unset other primary addresses for this user
            if (is_primary) {
                const updateQuery = `
                    UPDATE addresses
                    SET is_primary = false
                    WHERE id IN (
                        SELECT a.id
                        FROM addresses a
                        JOIN address_relationships ar ON a.id = ar.address_id
                        WHERE ar.entity_type = 'user'
                        AND ar.entity_id = $1
                        AND ar.is_active = true
                        AND a.id != $2
                    )
                `;
                await client.query(updateQuery, [currentUserId, addressId]);
            }

            // Update the address
            const updateQuery = `
                UPDATE addresses
                SET address_line_1 = $1, address_line_2 = $2, locality = $3,
                    administrative_area = $4, postal_code = $5, country_code = $6,
                    address_type = $7, label = $8, is_primary = $9,
                    latitude = $10, longitude = $11, updated_at = NOW()
                WHERE id = $12
                RETURNING *
            `;

            const result = await client.query(updateQuery, [
                address_line_1,
                address_line_2,
                locality,
                administrative_area,
                postal_code,
                country_code,
                address_type,
                label,
                is_primary,
                latitude,
                longitude,
                addressId,
            ]);

            await client.query("COMMIT");
            res.json(result.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ error: "Failed to update address" });
    }
});

// Delete an address (soft delete by setting relationship to inactive)
router.delete("/addresses/:addressId", authenticateToken, async (req, res) => {
    try {
        const { addressId } = req.params;
        const currentUserId = req.user.userId || req.user.id;

        // Check if user can delete this address
        const checkQuery = `
            SELECT ar.*
            FROM address_relationships ar
            JOIN addresses a ON a.id = ar.address_id
            WHERE a.id = $1
            AND ar.entity_type = 'user'
            AND ar.entity_id = $2
            AND ar.is_active = true
        `;

        const checkResult = await pool.query(checkQuery, [addressId, currentUserId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Address not found or access denied" });
        }

        // Soft delete by setting relationship to inactive
        const deleteQuery = `
            UPDATE address_relationships
            SET is_active = false
            WHERE address_id = $1
            AND entity_type = 'user'
            AND entity_id = $2
        `;

        await pool.query(deleteQuery, [addressId, currentUserId]);
        res.json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Failed to delete address" });
    }
});

// Geocoding search endpoint (placeholder - would integrate with real geocoding service)
router.get("/geocoding/search", async (req, res) => {
    try {
        const { q, country } = req.query;

        if (!q || q.length < 3) {
            return res.json({ suggestions: [] });
        }

        // This is a placeholder - in a real implementation you would integrate with
        // a geocoding service like Google Places API, Mapbox, or OpenStreetMap Nominatim
        const mockSuggestions = [
            {
                formatted_address: `${q}, Paris, France`,
                address_line_1: q,
                locality: "Paris",
                administrative_area: "Île-de-France",
                postal_code: "75001",
                country_code: country || "FR",
                latitude: 48.8566,
                longitude: 2.3522,
            },
        ];

        res.json({ suggestions: mockSuggestions });
    } catch (error) {
        console.error("Error in geocoding search:", error);
        res.status(500).json({ error: "Geocoding search failed" });
    }
});

// Debug endpoint to check user's address data
router.get("/debug/users/:userId/addresses", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId || req.user.id;

        // Check if user can access this data (must be their own data or admin)
        if (currentUserId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        // Get all addresses for this user
        const addressQuery = `
            SELECT
                a.*,
                ar.relationship_type,
                ar.is_active,
                ar.created_at as relationship_created_at
            FROM addresses a
            JOIN address_relationships ar ON a.id = ar.address_id
            WHERE ar.entity_type = 'user'
            AND ar.entity_id = $1
            ORDER BY ar.is_active DESC, a.is_primary DESC, a.created_at DESC
        `;

        const addressResult = await pool.query(addressQuery, [userId]);

        // Get user profile data
        const profileQuery = `
            SELECT user_id, street_number, street_name, city, postal_code, country
            FROM user_profiles
            WHERE user_id = $1
        `;

        const profileResult = await pool.query(profileQuery, [userId]);

        res.json({
            userId,
            currentUserId,
            addresses: addressResult.rows,
            originalProfile: profileResult.rows[0] || null,
            addressCount: addressResult.rows.length,
        });
    } catch (error) {
        console.error("Error in debug endpoint:", error);
        res.status(500).json({ error: "Failed to fetch debug data" });
    }
});

export default router;
