const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const pool = require('../db');

class PDFTicketService {
    constructor() {
        this.browser = null;
        this.uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
    }

    /**
     * Initialize browser
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
        }
        return this.browser;
    }

    /**
     * Ensure upload directory exists
     */
    async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Generate QR code as base64 data URL
     */
    async generateQRCode(content) {
        try {
            return await QRCode.toDataURL(content, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    }

    /**
     * Get QR code content based on type and ticket data
     */
    getQRCodeContent(qrType, ticketData, customData = null, qrConfig = {}) {
        const baseUrl = process.env.CLIENT_URL || 'https://be-out.app';

        switch (qrType) {
            case 'verification_url':
                return `${baseUrl}/verify/${ticketData.ticket_number}`;
            case 'booking_reference':
                return ticketData.ticket_number;
            case 'ticket_hash':
                // Generate secure hash from booking and ticket data
                return crypto.createHash('sha256')
                    .update(`${ticketData.booking_id}-${ticketData.ticket_number}-${ticketData.created_at}`)
                    .digest('hex');
            case 'custom_data':
                try {
                    return customData ? JSON.stringify(JSON.parse(customData)) : ticketData.ticket_number;
                } catch {
                    return ticketData.ticket_number;
                }
            case 'prefixed_number':
                const prefix = qrConfig.qr_prefix || 'TICKET';
                const suffix = qrConfig.qr_suffix || '';
                const ticketNumber = ticketData.ticket_number || ticketData.booking_reference || '001';
                return `${prefix}${ticketNumber}${suffix}`;
            case 'json_data':
                const jsonData = {
                    event_id: ticketData.event_id,
                    ticket_number: ticketData.ticket_number,
                    booking_id: ticketData.booking_id,
                    event_title: ticketData.event_title,
                    user_name: ticketData.user_name,
                    event_date: ticketData.event_date,
                    ...qrConfig.qr_json_fields || {}
                };
                return JSON.stringify(jsonData);
            case 'simple_url':
                const customUrl = qrConfig.qr_custom_url || `${baseUrl}/event/${ticketData.event_id}`;
                return customUrl;
            default:
                return ticketData.ticket_number;
        }
    }

    /**
     * Generate HTML template for ticket
     */
    async generateTicketHTML(ticketData, eventData, templateConfig = null) {
        // Get template configuration with defaults
        const config = {
            ticket_size: templateConfig?.ticket_size || 'a4',
            primary_color: templateConfig?.primary_color || '#1976d2',
            secondary_color: templateConfig?.secondary_color || '#9c27b0',
            background_image: templateConfig?.background_image || null,
            app_logo: templateConfig?.app_logo || 'be-out_logo_noir.png',
            custom_message: templateConfig?.custom_message || '',
            qr_code_type: templateConfig?.qr_code_type || 'booking_reference',
            qr_custom_data: templateConfig?.qr_custom_data || null
        };

        // Generate QR code
        const qrContent = this.getQRCodeContent(config.qr_code_type, ticketData, config.qr_custom_data, templateConfig);
        console.log('Generated QR content:', qrContent, 'for type:', config.qr_code_type);
        const qrCodeDataURL = await this.generateQRCode(qrContent);

        // Determine ticket dimensions and layout
        const dimensions = this.getTicketDimensions(config.ticket_size);

        // Format date and time
        const eventDate = new Date(eventData.event_date);
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ticket - ${eventData.title}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Arial', sans-serif;
                    background: #ffffff;
                    color: #333;
                }

                .ticket {
                    width: ${dimensions.width}mm;
                    height: ${dimensions.height}mm;
                    position: relative;
                    border: 2px dashed ${config.primary_color};
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    background: ${config.background_image ? `url(${config.background_image})` : '#ffffff'};
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }

                /* Background overlay for readability */
                .background-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.background_image ? 'rgba(255, 255, 255, 0.85)' : 'transparent'};
                    z-index: 1;
                }

                .ticket-header {
                    background: linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%);
                    color: white;
                    padding: ${(15 * dimensions.fontScale).toFixed(0)}px ${(20 * dimensions.fontScale).toFixed(0)}px;
                    text-align: center;
                    position: relative;
                    z-index: 2;
                }

                .event-title {
                    font-size: ${(24 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: bold;
                    margin-bottom: ${(8 * dimensions.fontScale).toFixed(0)}px;
                    line-height: 1.2;
                }

                .event-category {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: ${(4 * dimensions.fontScale).toFixed(0)}px ${(8 * dimensions.fontScale).toFixed(0)}px;
                    border-radius: 12px;
                    font-size: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: bold;
                }

                .ticket-content {
                    flex: 1;
                    padding: ${(20 * dimensions.fontScale).toFixed(0)}px;
                    position: relative;
                    z-index: 2;
                    ${dimensions.layout === 'twoColumn' ?
                        'display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: start;' :
                        'display: flex; flex-direction: column; justify-content: space-between;'
                    }
                }

                .event-details {
                    ${dimensions.layout !== 'twoColumn' ? 'margin-bottom: 20px;' : ''}
                }

                .info-item {
                    margin-bottom: ${(12 * dimensions.fontScale).toFixed(0)}px;
                    ${dimensions.layout === 'twoColumn' ? '' : 'display: flex; justify-content: space-between; align-items: center;'}
                }

                .info-label {
                    font-size: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: bold;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: ${(4 * dimensions.fontScale).toFixed(0)}px;
                    display: block;
                }

                .info-value {
                    font-size: ${(14 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: 500;
                    color: #333;
                    display: block;
                }

                .ticket-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: ${(15 * dimensions.fontScale).toFixed(0)}px;
                }

                .ticket-number-section {
                    text-align: center;
                }

                .ticket-number-label {
                    font-size: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: bold;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: ${(4 * dimensions.fontScale).toFixed(0)}px;
                }

                .ticket-number {
                    font-size: ${(14 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                    color: #333;
                }

                .qr-section {
                    text-align: center;
                }

                .qr-code {
                    width: ${dimensions.qrSize}px;
                    height: ${dimensions.qrSize}px;
                    margin: 0 auto ${(8 * dimensions.fontScale).toFixed(0)}px auto;
                    display: block;
                }

                .qr-label {
                    font-size: ${(9 * dimensions.fontScale).toFixed(0)}px;
                    color: #666;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: ${(4 * dimensions.fontScale).toFixed(0)}px;
                }

                .qr-type {
                    font-size: ${(8 * dimensions.fontScale).toFixed(0)}px;
                    color: #888;
                }

                .purchase-date {
                    font-size: ${(9 * dimensions.fontScale).toFixed(0)}px;
                    color: #666;
                    text-align: center;
                }

                .custom-message {
                    margin-top: ${(15 * dimensions.fontScale).toFixed(0)}px;
                    padding: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 6px;
                    text-align: center;
                    font-style: italic;
                    font-size: ${(11 * dimensions.fontScale).toFixed(0)}px;
                    color: #555;
                }

                .app-logo {
                    position: absolute;
                    bottom: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    right: ${(10 * dimensions.fontScale).toFixed(0)}px;
                    width: ${(25 * dimensions.fontScale).toFixed(0)}px;
                    height: auto;
                    opacity: 0.7;
                    z-index: 3;
                }

                @page {
                    size: ${config.ticket_size === 'a4' ? 'A4' : config.ticket_size === 'half-a4' ? 'A5 landscape' : 'A6'};
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                ${config.background_image ? '<div class="background-overlay"></div>' : ''}

                <div class="ticket-header">
                    <div class="event-title">${eventData.title}</div>
                    ${eventData.category_name ? `<div class="event-category">${eventData.category_name}</div>` : ''}
                </div>

                <div class="ticket-content">
                    <div class="event-details">
                        <div class="info-item">
                            <span class="info-label">📅 Date & Heure</span>
                            <span class="info-value">${formattedDate} - ${formattedTime}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📍 Lieu</span>
                            <span class="info-value">${eventData.location || eventData.formatted_address || 'Lieu à confirmer'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">👤 Porteur</span>
                            <span class="info-value">${ticketData.user_name || 'Porteur du billet'}</span>
                        </div>
                    </div>

                    <div class="ticket-info">
                        <div class="ticket-number-section">
                            <div class="ticket-number-label">N° Billet</div>
                            <div class="ticket-number">${ticketData.ticket_number}</div>
                        </div>

                        <div class="qr-section">
                            <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" />
                            <div class="qr-label">QR Code</div>
                            <div class="qr-type">
                                ${config.qr_code_type === 'booking_reference' ? 'Référence' :
                                  config.qr_code_type === 'ticket_hash' ? 'Hash Sécurisé' :
                                  config.qr_code_type === 'prefixed_number' ? 'Code personnalisé' :
                                  config.qr_code_type === 'json_data' ? 'Données JSON' :
                                  config.qr_code_type === 'simple_url' ? 'URL personnalisée' :
                                  'Données Custom'}
                            </div>
                        </div>

                        <div class="purchase-date">
                            Acheté le ${new Date().toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                </div>

                ${config.custom_message ? `<div class="custom-message">${config.custom_message}</div>` : ''}

                ${config.app_logo && config.app_logo !== '' ?
                    `<img src="${process.cwd()}/public/${config.app_logo}" class="app-logo" alt="Logo"/>` : ''}
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Get ticket dimensions based on size
     */
    getTicketDimensions(size) {
        switch (size) {
            case 'half-a4':
                return {
                    width: 210,
                    height: 148,
                    layout: 'twoColumn',
                    qrSize: 80,
                    fontScale: 0.9
                };
            case 'quarter-a4':
                return {
                    width: 148,
                    height: 105,
                    layout: 'compact',
                    qrSize: 70,
                    fontScale: 0.7
                };
            case 'a4':
            default:
                return {
                    width: 210,
                    height: 297,
                    layout: 'standard',
                    qrSize: 90,
                    fontScale: 1.0
                };
        }
    }

    /**
     * Generate PDF for a single ticket
     */
    async generateTicketPDF(ticketId) {
        const client = await pool.connect();

        try {
            // Get ticket data with event and template information
            const ticketQuery = `
                SELECT
                    bt.*,
                    b.booking_reference,
                    b.user_id,
                    b.booking_date,
                    e.title as event_title,
                    e.event_date,
                    e.customizations,
                    e.ticket_template_id,
                    v.name as venue_name,
                    cat.name as category_name,
                    tt.template_data,
                    u.email,
                    COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.email) as user_name
                FROM booking_tickets bt
                JOIN bookings b ON bt.booking_id = b.id
                JOIN events e ON b.event_id = e.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN venues v ON e.venue_id = v.id
                LEFT JOIN event_categories ec ON e.id = ec.event_id
                LEFT JOIN categories cat ON ec.category_id = cat.id
                LEFT JOIN ticket_templates tt ON e.ticket_template_id = tt.id
                WHERE bt.id = $1
            `;

            const result = await client.query(ticketQuery, [ticketId]);

            if (result.rows.length === 0) {
                throw new Error('Ticket not found');
            }

            const ticketData = result.rows[0];
            const eventData = {
                title: ticketData.event_title,
                event_date: ticketData.event_date,
                event_time: ticketData.event_date, // Same as event_date since it contains both date and time
                location: ticketData.venue_name,
                formatted_address: ticketData.venue_name, // Use venue name as address for now
                category_name: ticketData.category_name
            };

            // Merge template data with event-specific customizations
            const templateConfig = {
                ...ticketData.template_data,
                ...ticketData.customizations
            };

            // Generate HTML
            const html = await this.generateTicketHTML(ticketData, eventData, templateConfig);

            // Ensure upload directory exists
            await this.ensureUploadDir();

            // Initialize browser
            const browser = await this.initBrowser();
            const page = await browser.newPage();

            // Generate PDF
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfFileName = `ticket-${ticketData.ticket_number}-${Date.now()}.pdf`;
            const pdfPath = path.join(this.uploadDir, pdfFileName);

            const isViewMode = false; // This will be passed from the route

            await page.pdf({
                path: pdfPath,
                format: templateConfig?.ticket_size === 'a4' ? 'A4' :
                       templateConfig?.ticket_size === 'half-a4' ? 'A5' : 'A6',
                landscape: templateConfig?.ticket_size === 'half-a4',
                margin: {
                    top: '5mm',
                    right: '5mm',
                    bottom: '5mm',
                    left: '5mm'
                },
                printBackground: true
            });

            await page.close();

            // Update database with PDF info
            const pdfUrl = `/uploads/tickets/${pdfFileName}`;
            await client.query(
                'UPDATE booking_tickets SET pdf_file_url = $1, pdf_generated_at = NOW() WHERE id = $2',
                [pdfUrl, ticketId]
            );

            return {
                success: true,
                pdfPath,
                pdfUrl,
                ticketNumber: ticketData.ticket_number
            };

        } finally {
            client.release();
        }
    }

    /**
     * Generate PDFs for all tickets in a booking
     */
    async generateBookingTicketsPDFs(bookingId) {
        const client = await pool.connect();

        try {
            // Get all tickets for this booking
            const ticketsResult = await client.query(
                'SELECT id FROM booking_tickets WHERE booking_id = $1 ORDER BY ticket_number',
                [bookingId]
            );

            const results = [];
            for (const ticket of ticketsResult.rows) {
                try {
                    const pdfResult = await this.generateTicketPDF(ticket.id);
                    results.push(pdfResult);
                } catch (error) {
                    console.error(`Failed to generate PDF for ticket ${ticket.id}:`, error);
                    results.push({
                        success: false,
                        error: error.message,
                        ticketId: ticket.id
                    });
                }
            }

            return {
                success: true,
                results,
                totalTickets: ticketsResult.rows.length,
                successCount: results.filter(r => r.success).length
            };

        } finally {
            client.release();
        }
    }

    /**
     * Cleanup browser resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new PDFTicketService();
