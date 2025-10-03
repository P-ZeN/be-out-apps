import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../db.js';

const router = express.Router();
const db = pool;

/**
 * Content Management API Routes
 * Handles blog posts, legal pages, and other content
 */

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }
    next();
};

// Get all content pages with pagination and filtering
router.get('/pages', [
    query('category').optional().isIn(['page', 'blog', 'legal']),
    query('published').optional().isBoolean(),
    query('language').optional().isLength({ min: 2, max: 5 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
    try {
        const {
            category,
            published,
            language = 'fr',
            page = 1,
            limit = 20,
            search
        } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (category) {
            whereConditions.push(`cp.category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        if (published !== undefined) {
            whereConditions.push(`cp.published = $${paramIndex}`);
            queryParams.push(published === 'true');
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(ct.title ILIKE $${paramIndex} OR ct.content ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Add language and pagination params
        queryParams.push(language);
        const languageParamIndex = paramIndex++;
        queryParams.push(parseInt(limit));
        const limitParamIndex = paramIndex++;
        queryParams.push((parseInt(page) - 1) * parseInt(limit));
        const offsetParamIndex = paramIndex++;

        const query = `
            SELECT
                cp.id,
                cp.slug,
                cp.category,
                cp.featured_image,
                cp.keywords,
                cp.published,
                cp.view_count,
                cp.created_at,
                cp.updated_at,
                ct.title,
                ct.excerpt,
                ct.meta_description,
                ct.language
            FROM content_pages cp
            LEFT JOIN content_translations ct ON cp.id = ct.page_id AND ct.language = $${languageParamIndex}
            ${whereClause}
            ORDER BY cp.created_at DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;

        const countQuery = `
            SELECT COUNT(DISTINCT cp.id) as total
            FROM content_pages cp
            LEFT JOIN content_translations ct ON cp.id = ct.page_id AND ct.language = $${languageParamIndex}
            ${whereClause}
        `;

        const [pagesResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                pages: pagesResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching content pages:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single content page by slug with all translations
router.get('/pages/:slug', [
    param('slug').isSlug()
], handleValidationErrors, async (req, res) => {
    try {
        const { slug } = req.params;

        // Get page info
        const pageQuery = `
            SELECT id, slug, category, featured_image, keywords, published, view_count, created_at, updated_at
            FROM content_pages
            WHERE slug = $1
        `;
        const pageResult = await db.query(pageQuery, [slug]);

        if (pageResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        const page = pageResult.rows[0];

        // Get all translations
        const translationsQuery = `
            SELECT language, title, content, meta_description, excerpt, created_at, updated_at
            FROM content_translations
            WHERE page_id = $1
            ORDER BY language
        `;
        const translationsResult = await db.query(translationsQuery, [page.id]);

        // Increment view count if published
        if (page.published) {
            await db.query('UPDATE content_pages SET view_count = view_count + 1 WHERE id = $1', [page.id]);
            page.view_count = page.view_count + 1;
        }

        res.json({
            success: true,
            data: {
                ...page,
                translations: translationsResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching content page:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new content page (admin only - add auth middleware as needed)
router.post('/pages', [
    body('slug').isSlug().isLength({ min: 1, max: 255 }),
    body('category').isIn(['page', 'blog', 'legal']),
    body('featured_image').optional().isURL(),
    body('keywords').optional().isArray(),
    body('published').optional().isBoolean(),
    body('translations').isArray({ min: 1 }),
    body('translations.*.language').isLength({ min: 2, max: 5 }),
    body('translations.*.title').isLength({ min: 1, max: 500 }),
    body('translations.*.content').isLength({ min: 1 }),
    body('translations.*.meta_description').optional().isString(),
    body('translations.*.excerpt').optional().isString()
], handleValidationErrors, async (req, res) => {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const {
            slug,
            category = 'page',
            featured_image,
            keywords = [],
            published = false,
            translations
        } = req.body;

        // Check if slug already exists
        const existingSlug = await client.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
        if (existingSlug.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Slug already exists'
            });
        }

        // Insert main page
        const pageQuery = `
            INSERT INTO content_pages (slug, category, featured_image, keywords, published)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at, updated_at
        `;
        const pageResult = await client.query(pageQuery, [
            slug,
            category,
            featured_image,
            keywords,
            published
        ]);

        const pageId = pageResult.rows[0].id;

        // Insert translations
        for (const translation of translations) {
            const translationQuery = `
                INSERT INTO content_translations (page_id, language, title, content, meta_description, excerpt)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await client.query(translationQuery, [
                pageId,
                translation.language,
                translation.title,
                translation.content,
                translation.meta_description || null,
                translation.excerpt || null
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: {
                id: pageId,
                slug,
                category,
                featured_image,
                keywords,
                published,
                created_at: pageResult.rows[0].created_at,
                updated_at: pageResult.rows[0].updated_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating content page:', error);

        if (error.code === '23505') { // Unique constraint violation
            res.status(400).json({
                success: false,
                message: 'Slug already exists'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    } finally {
        client.release();
    }
});

// Update content page (admin only)
router.put('/pages/:id', [
    param('id').isUUID(),
    body('slug').optional().isSlug().isLength({ min: 1, max: 255 }),
    body('category').optional().isIn(['page', 'blog', 'legal']),
    body('featured_image').optional().isURL(),
    body('keywords').optional().isArray(),
    body('published').optional().isBoolean(),
    body('translations').optional().isArray({ min: 1 }),
    body('translations.*.language').isLength({ min: 2, max: 5 }),
    body('translations.*.title').isLength({ min: 1, max: 500 }),
    body('translations.*.content').isLength({ min: 1 }),
    body('translations.*.meta_description').optional().isString(),
    body('translations.*.excerpt').optional().isString()
], handleValidationErrors, async (req, res) => {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const {
            slug,
            category,
            featured_image,
            keywords,
            published,
            translations
        } = req.body;

        // Check if page exists
        const existingPage = await client.query('SELECT id, slug FROM content_pages WHERE id = $1', [id]);
        if (existingPage.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        // Check if new slug conflicts (if changed)
        if (slug && slug !== existingPage.rows[0].slug) {
            const slugConflict = await client.query('SELECT id FROM content_pages WHERE slug = $1 AND id != $2', [slug, id]);
            if (slugConflict.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Slug already exists'
                });
            }
        }

        // Build update query for main page
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (slug !== undefined) {
            updateFields.push(`slug = $${paramIndex}`);
            updateValues.push(slug);
            paramIndex++;
        }
        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex}`);
            updateValues.push(category);
            paramIndex++;
        }
        if (featured_image !== undefined) {
            updateFields.push(`featured_image = $${paramIndex}`);
            updateValues.push(featured_image);
            paramIndex++;
        }
        if (keywords !== undefined) {
            updateFields.push(`keywords = $${paramIndex}`);
            updateValues.push(keywords);
            paramIndex++;
        }
        if (published !== undefined) {
            updateFields.push(`published = $${paramIndex}`);
            updateValues.push(published);
            paramIndex++;
        }

        if (updateFields.length > 0) {
            updateFields.push(`updated_at = NOW()`);
            updateValues.push(id);
            const updateQuery = `
                UPDATE content_pages
                SET ${updateFields.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING updated_at
            `;
            await client.query(updateQuery, updateValues);
        }

        // Update translations if provided
        if (translations) {
            // Delete existing translations
            await client.query('DELETE FROM content_translations WHERE page_id = $1', [id]);

            // Insert new translations
            for (const translation of translations) {
                const translationQuery = `
                    INSERT INTO content_translations (page_id, language, title, content, meta_description, excerpt)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                await client.query(translationQuery, [
                    id,
                    translation.language,
                    translation.title,
                    translation.content,
                    translation.meta_description || null,
                    translation.excerpt || null
                ]);
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Page updated successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating content page:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        client.release();
    }
});

// Delete content page (admin only)
router.delete('/pages/:id', [
    param('id').isUUID()
], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM content_pages WHERE id = $1 RETURNING slug', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting content page:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get content page by slug and language (public endpoint for frontend)
router.get('/public/:slug', [
    param('slug').isSlug(),
    query('lang').optional().isLength({ min: 2, max: 5 })
], handleValidationErrors, async (req, res) => {
    try {
        const { slug } = req.params;
        const { lang = 'fr' } = req.query;

        const query = `
            SELECT
                cp.id,
                cp.slug,
                cp.category,
                cp.featured_image,
                cp.keywords,
                cp.published,
                cp.view_count,
                cp.created_at,
                cp.updated_at,
                ct.title,
                ct.content,
                ct.meta_description,
                ct.excerpt,
                ct.language
            FROM content_pages cp
            LEFT JOIN content_translations ct ON cp.id = ct.page_id AND ct.language = $2
            WHERE cp.slug = $1 AND cp.published = true
        `;

        const result = await db.query(query, [slug, lang]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        // Increment view count
        await db.query('UPDATE content_pages SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching public content page:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get rendered HTML page by slug (for mobile apps and external links)
router.get('/pages/:slug/rendered', [
    param('slug').isSlug(),
    query('lang').optional().isLength({ min: 2, max: 5 })
], handleValidationErrors, async (req, res) => {
    try {
        const { slug } = req.params;
        const { lang = 'fr' } = req.query;

        const query = `
            SELECT
                cp.id,
                cp.slug,
                cp.category,
                cp.featured_image,
                cp.keywords,
                cp.published,
                cp.view_count,
                cp.created_at,
                cp.updated_at,
                ct.title,
                ct.content,
                ct.meta_description,
                ct.excerpt,
                ct.language
            FROM content_pages cp
            LEFT JOIN content_translations ct ON cp.id = ct.page_id AND ct.language = $2
            WHERE cp.slug = $1 AND cp.published = true
        `;

        const result = await db.query(query, [slug, lang]);

        if (result.rows.length === 0) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="${lang}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Page non trouvée - Be Out</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                               padding: 20px; text-align: center; color: #333; }
                        .error { color: #e74c3c; margin-top: 50px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h1>404</h1>
                        <p>Page non trouvée</p>
                    </div>
                </body>
                </html>
            `);
        }

        const page = result.rows[0];

        // Increment view count
        await db.query('UPDATE content_pages SET view_count = view_count + 1 WHERE id = $1', [page.id]);

        // Generate HTML response
        const html = `
            <!DOCTYPE html>
            <html lang="${page.language || lang}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${page.title} - Be Out</title>
                <meta name="description" content="${page.meta_description || page.excerpt || ''}">
                <meta name="keywords" content="${Array.isArray(page.keywords) ? page.keywords.join(', ') : ''}">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f8f9fa;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #0288d1;
                        border-bottom: 3px solid #0288d1;
                        padding-bottom: 10px;
                        margin-bottom: 30px;
                    }
                    h2 {
                        color: #0288d1;
                        margin-top: 30px;
                    }
                    h3 {
                        color: #666;
                    }
                    p {
                        margin-bottom: 16px;
                    }
                    ul, ol {
                        margin-bottom: 16px;
                        padding-left: 30px;
                    }
                    li {
                        margin-bottom: 8px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eee;
                    }
                    .logo {
                        color: #0288d1;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 14px;
                    }
                    .content img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .last-updated {
                        color: #666;
                        font-size: 14px;
                        font-style: italic;
                        margin-top: 30px;
                    }
                    @media (max-width: 600px) {
                        body { padding: 10px; }
                        .container { padding: 20px; }
                        h1 { font-size: 24px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">Be Out</div>
                        <h1>${page.title}</h1>
                    </div>

                    <div class="content">
                        ${page.content}
                    </div>

                    <div class="last-updated">
                        Dernière mise à jour : ${new Date(page.updated_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>

                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Be Out. Tous droits réservés.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(html);

    } catch (error) {
        console.error('Error fetching rendered content page:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="${req.query.lang || 'fr'}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Erreur - Be Out</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                           padding: 20px; text-align: center; color: #333; }
                    .error { color: #e74c3c; margin-top: 50px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>Erreur</h1>
                    <p>Une erreur s'est produite lors du chargement de la page.</p>
                </div>
            </body>
            </html>
        `);
    }
});

export default router;
