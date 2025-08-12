const express = require('express');
const router = express.Router();
const { authenticateOrganizer } = require('../middleware/auth');
const db = require('../db');

// GET /api/organizer/ticket-templates
router.get('/', authenticateOrganizer, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM ticket_templates WHERE organizer_id = $1 OR is_global = true ORDER BY created_at DESC',
            [req.organizer.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ticket templates:', error);
        res.status(500).json({ message: 'Error fetching ticket templates' });
    }
});

// POST /api/organizer/ticket-templates
router.post('/', authenticateOrganizer, async (req, res) => {
    try {
        const { name, description, configuration } = req.body;

        const result = await db.query(
            'INSERT INTO ticket_templates (name, description, configuration, organizer_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, JSON.stringify(configuration), req.organizer.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating ticket template:', error);
        res.status(500).json({ message: 'Error creating ticket template' });
    }
});

// PUT /api/organizer/ticket-templates/:id
router.put('/:id', authenticateOrganizer, async (req, res) => {
    try {
        const { name, description, configuration } = req.body;
        const templateId = req.params.id;

        const result = await db.query(
            'UPDATE ticket_templates SET name = $1, description = $2, configuration = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND organizer_id = $5 RETURNING *',
            [name, description, JSON.stringify(configuration), templateId, req.organizer.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket template not found or not authorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating ticket template:', error);
        res.status(500).json({ message: 'Error updating ticket template' });
    }
});

// DELETE /api/organizer/ticket-templates/:id
router.delete('/:id', authenticateOrganizer, async (req, res) => {
    try {
        const templateId = req.params.id;

        const result = await db.query(
            'DELETE FROM ticket_templates WHERE id = $1 AND organizer_id = $2 RETURNING *',
            [templateId, req.organizer.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket template not found or not authorized' });
        }

        res.json({ message: 'Ticket template deleted successfully' });
    } catch (error) {
        console.error('Error deleting ticket template:', error);
        res.status(500).json({ message: 'Error deleting ticket template' });
    }
});

module.exports = router;
