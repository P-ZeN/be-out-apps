import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import pdfTicketService from '../services/pdfTicketService.js';
import pool from '../db.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

/**
 * Generate PDF for a specific ticket
 * GET /api/tickets/:ticketId/pdf
 */
router.get('/:ticketId/pdf', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;

        // Verify the user owns this ticket or is an admin/organizer
        const client = await pool.connect();
        try {
            const ticketResult = await client.query(`
                SELECT bt.*, b.user_id, e.organizer_id
                FROM booking_tickets bt
                JOIN bookings b ON bt.booking_id = b.id
                JOIN events e ON b.event_id = e.id
                WHERE bt.id = $1
            `, [ticketId]);

            if (ticketResult.rows.length === 0) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            const ticket = ticketResult.rows[0];
            const isOwner = req.user.id === ticket.user_id;
            const isOrganizer = req.user.id === ticket.organizer_id;
            const isAdmin = req.user.role === 'admin';

            if (!isOwner && !isOrganizer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Generate PDF if it doesn't exist or is outdated
            let shouldRegenerate = !ticket.pdf_file_url || !ticket.pdf_generated_at;

            // TEMPORARY: Force regeneration to test new design
            shouldRegenerate = true;

            if (ticket.pdf_file_url && ticket.pdf_generated_at && false) { // Disabled caching temporarily
                // Check if file exists on disk
                const filePath = path.join(process.cwd(), 'uploads', 'tickets', path.basename(ticket.pdf_file_url));
                try {
                    await fs.access(filePath);
                } catch {
                    shouldRegenerate = true;
                }
            }

            const isViewMode = req.query.view === 'true';

            if (shouldRegenerate) {
                console.log('🎫 Regenerating PDF for ticket:', ticketId);
                const result = await pdfTicketService.generateTicketPDF(ticketId);
                if (!result.success) {
                    return res.status(500).json({ error: 'Failed to generate PDF' });
                }

                console.log('✅ PDF generated successfully:', result.pdfPath);

                // Return the generated PDF
                if (isViewMode) {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline; filename="ticket.pdf"');
                } else {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename="ticket.pdf"');
                }

                // Add cache-busting headers for development
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('ETag', Date.now().toString());

                return res.sendFile(result.pdfPath);
            } else {
                // Return existing PDF
                const filePath = path.join(process.cwd(), 'uploads', 'tickets', path.basename(ticket.pdf_file_url));
                if (isViewMode) {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline; filename="ticket.pdf"');
                } else {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename="ticket.pdf"');
                }
                return res.sendFile(filePath);
            }

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error generating ticket PDF:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Generate PDFs for all tickets in a booking
 * POST /api/bookings/:bookingId/tickets/pdf
 */
router.post('/booking/:bookingId/generate', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Verify the user owns this booking or is an admin/organizer
        const client = await pool.connect();
        try {
            const bookingResult = await client.query(`
                SELECT b.*, e.organizer_id
                FROM bookings b
                JOIN events e ON b.event_id = e.id
                WHERE b.id = $1
            `, [bookingId]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            const booking = bookingResult.rows[0];
            const isOwner = req.user.id === booking.user_id;
            const isOrganizer = req.user.id === booking.organizer_id;
            const isAdmin = req.user.role === 'admin';

            if (!isOwner && !isOrganizer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Generate PDFs for all tickets
            const results = await pdfTicketService.generateBookingTicketsPDFs(bookingId);

            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            res.json({
                success: true,
                generated: successful.length,
                failed: failed.length,
                results: results
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error generating booking PDFs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get ticket information with PDF status
 * GET /api/tickets/:ticketId
 */
router.get('/:ticketId', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT
                    bt.*,
                    b.booking_reference,
                    b.user_id,
                    e.title as event_title,
                    e.event_date,
                    e.organizer_id
                FROM booking_tickets bt
                JOIN bookings b ON bt.booking_id = b.id
                JOIN events e ON b.event_id = e.id
                WHERE bt.id = $1
            `, [ticketId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            const ticket = result.rows[0];
            const isOwner = req.user.id === ticket.user_id;
            const isOrganizer = req.user.id === ticket.organizer_id;
            const isAdmin = req.user.role === 'admin';

            if (!isOwner && !isOrganizer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Remove sensitive data for non-admin users
            if (!isAdmin && !isOrganizer) {
                delete ticket.organizer_id;
            }

            res.json({
                success: true,
                ticket: ticket
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * List all tickets for a booking
 * GET /api/bookings/:bookingId/tickets
 */
router.get('/booking/:bookingId/list', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const client = await pool.connect();
        try {
            // Verify access
            const bookingResult = await client.query(`
                SELECT b.*, e.organizer_id
                FROM bookings b
                JOIN events e ON b.event_id = e.id
                WHERE b.id = $1
            `, [bookingId]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            const booking = bookingResult.rows[0];
            const isOwner = req.user.id === booking.user_id;
            const isOrganizer = req.user.id === booking.organizer_id;
            const isAdmin = req.user.role === 'admin';

            if (!isOwner && !isOrganizer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get tickets
            const ticketsResult = await client.query(`
                SELECT
                    bt.*,
                    e.title as event_title,
                    e.event_date
                FROM booking_tickets bt
                JOIN bookings b ON bt.booking_id = b.id
                JOIN events e ON b.event_id = e.id
                WHERE bt.booking_id = $1
                ORDER BY bt.ticket_number
            `, [bookingId]);

            res.json({
                success: true,
                booking: booking,
                tickets: ticketsResult.rows
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching booking tickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
