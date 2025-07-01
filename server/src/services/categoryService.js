// Category Management Service for Admin
import pool from "../db.js";

export class CategoryService {
    // Get all categories with all translations
    static async getAllCategoriesWithTranslations() {
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    id,
                    name,
                    name_fr,
                    name_en,
                    name_es,
                    description,
                    description_fr,
                    description_en,
                    description_es,
                    icon,
                    color,
                    created_at,
                    (SELECT COUNT(*) FROM event_categories ec
                     LEFT JOIN events e ON ec.event_id = e.id
                     WHERE ec.category_id = c.id AND e.status = 'active') as event_count
                FROM categories c
                ORDER BY name_fr, name
            `;

            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Create a new category with translations
    static async createCategory(categoryData) {
        const client = await pool.connect();
        try {
            const { name_fr, name_en, name_es, description_fr, description_en, description_es, icon, color } =
                categoryData;

            const query = `
                INSERT INTO categories (
                    name, name_fr, name_en, name_es,
                    description, description_fr, description_en, description_es,
                    icon, color
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                ) RETURNING *
            `;

            const values = [
                name_fr || name_en || name_es, // fallback for legacy 'name' column
                name_fr,
                name_en,
                name_es,
                description_fr || description_en || description_es, // fallback for legacy 'description' column
                description_fr,
                description_en,
                description_es,
                icon,
                color,
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Update category translations
    static async updateCategory(id, categoryData) {
        const client = await pool.connect();
        try {
            const { name_fr, name_en, name_es, description_fr, description_en, description_es, icon, color } =
                categoryData;

            const query = `
                UPDATE categories SET
                    name = COALESCE($2, name_fr, name_en, name_es, name),
                    name_fr = $2,
                    name_en = $3,
                    name_es = $4,
                    description = COALESCE($5, description_fr, description_en, description_es, description),
                    description_fr = $5,
                    description_en = $6,
                    description_es = $7,
                    icon = $8,
                    color = $9
                WHERE id = $1
                RETURNING *
            `;

            const values = [id, name_fr, name_en, name_es, description_fr, description_en, description_es, icon, color];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Delete category (only if no events are using it)
    static async deleteCategory(id) {
        const client = await pool.connect();
        try {
            // Check if category is in use
            const checkQuery = `
                SELECT COUNT(*) as count
                FROM event_categories
                WHERE category_id = $1
            `;
            const checkResult = await client.query(checkQuery, [id]);

            if (parseInt(checkResult.rows[0].count) > 0) {
                throw new Error("Cannot delete category that is in use by events");
            }

            const deleteQuery = `DELETE FROM categories WHERE id = $1 RETURNING *`;
            const result = await client.query(deleteQuery, [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get category by ID with all translations
    static async getCategoryById(id) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT * FROM categories WHERE id = $1
            `;
            const result = await client.query(query, [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }
}
