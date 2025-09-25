import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import pool from '../db.js';

class PDFTicketService {
    constructor() {
        this.browser = null;
        this.uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
    }

    /**
     * Initialize browser instance (reuse for performance)
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
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
     * Generate QR code data URL
     */
    async generateQRCode(content, size = 150) {
        try {
            return await QRCode.toDataURL(content, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (error) {
            console.error('QR Code generation failed:', error);
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

        // Format event date and time
        const eventDate = new Date(eventData.event_date);
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = eventData.event_time || eventDate.toLocaleTimeString('fr-FR', {
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
                    background: ${config.background_image ? `url(${config.background_image})` : '#ffffff'};
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    border: 2px solid ${config.primary_color};
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                }

                .ticket-header {
                    background: linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%);
                    color: white;
                    padding: ${dimensions.layout === 'compact' ? '8px 12px' : '15px 20px'};
                    text-align: center;
                }

                .ticket-content {
                    flex: 1;
                    padding: ${dimensions.layout === 'compact' ? '8px' : '15px'};
                    background: rgba(255, 255, 255, 0.95);
                    ${dimensions.layout === 'twoColumn' ? 
                        'display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;' : 
                        'display: flex; flex-direction: column; justify-content: space-between;'
                    }
                }

                .event-title {
                    font-size: ${(24 * dimensions.fontScale).toFixed(0)}px;
                    font-weight: bold;
                    margin-bottom: ${dimensions.layout === 'compact' ? '4px' : '8px'};
                    line-height: 1.2;
                }

                .event-subtitle {
                    font-size: ${(12 * dimensions.fontScale).toFixed(0)}px;
                    opacity: 0.9;
                }

                .event-details {
                    ${dimensions.layout === 'twoColumn' ? '' : 'flex: 1;'}
                }

                .ticket-info {
                    ${dimensions.layout === 'twoColumn' ? 'display: flex; flex-direction: column; align-items: center; justify-content: center;' : 'margin-top: auto;'}
                }

                .event-info {
                    ${dimensions.layout === 'twoColumn' ? 'text-align: center;' : ''}
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: ${dimensions.layout === 'compact' ? '3px' : '8px'};
                    font-size: ${(11 * dimensions.fontScale).toFixed(0)}px;
                    ${dimensions.layout === 'twoColumn' ? 'justify-content: center; flex-direction: column; margin-bottom: 6px;' : ''}
                }

                .info-label {
                    font-weight: bold;
                    color: #666;
                    ${dimensions.layout === 'twoColumn' ? 'margin-bottom: 2px;' : ''}
                }

                .info-value {
                    font-weight: normal;
                    color: #333;
                }

                .ticket-details {
                    border-top: 1px dashed ${config.primary_color};
                    padding-top: ${dimensions.layout === 'compact' ? '6px' : '10px'};
                    margin-top: ${dimensions.layout === 'compact' ? '6px' : '10px'};
                }

                .qr-section {
                    text-align: center;
                    margin-top: ${dimensions.layout === 'compact' ? '6px' : '10px'};
                }

                .qr-code {
                    width: ${dimensions.qrSize}px;
                    height: ${dimensions.qrSize}px;
                    margin: 0 auto ${dimensions.layout === 'compact' ? '3px' : '5px'} auto;
                    display: block;
                }

                .ticket-number {
                    font-family: 'Courier New', monospace;
                    font-size: ${dimensions.layout === 'compact' ? '10px' : '12px'};
                    font-weight: bold;
                    color: ${config.primary_color};
                    text-align: center;
                    margin-bottom: ${dimensions.layout === 'compact' ? '3px' : '5px'};
                }

                .custom-message {
                    font-size: ${dimensions.layout === 'compact' ? '8px' : '10px'};
                    font-style: italic;
                    color: #666;
                    text-align: center;
                    margin-top: ${dimensions.layout === 'compact' ? '4px' : '8px'};
                    line-height: 1.3;
                }

                .footer-logo {
                    position: absolute;
                    bottom: ${dimensions.layout === 'compact' ? '3px' : '5px'};
                    right: ${dimensions.layout === 'compact' ? '5px' : '8px'};
                    width: ${dimensions.layout === 'compact' ? '15px' : '20px'};
                    height: auto;
                    opacity: 0.7;
                }

                @page {
                    size: ${config.ticket_size === 'a4' ? 'A4' : config.ticket_size === 'half-a4' ? 'A5 landscape' : 'A6'};
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="ticket-header">
                    <div class="event-title">${eventData.title}</div>
                    <div class="event-subtitle">${eventData.category_name || ''}</div>
                </div>

                <div class="ticket-content">
                    <div class="event-info">
                        <div class="info-item">
                            <span class="info-label">📅 Date</span>
                            <span class="info-value">${formattedDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">🕐 Heure</span>
                            <span class="info-value">${formattedTime}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📍 Lieu</span>
                            <span class="info-value">${eventData.location || eventData.formatted_address || 'À définir'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">👤 Porteur</span>
                            <span class="info-value">${ticketData.user_name || 'Porteur du billet'}</span>
                        </div>
                    </div>

                    <div class="ticket-details">
                        <div class="ticket-number">
                            N° ${ticketData.ticket_number}
                        </div>

                        <div class="qr-section">
                            ${qrCodeDataURL ? `<img src="${qrCodeDataURL}" class="qr-code" alt="QR Code"/>` : ''}
                            <div style="font-size: ${dimensions.layout === 'compact' ? '7px' : '8px'}; color: #888;">
                                ${config.qr_code_type === 'verification_url' ? 'Scan pour vérifier' :
                                  config.qr_code_type === 'booking_reference' ? 'Référence booking' :
                                  config.qr_code_type === 'ticket_hash' ? 'Hash sécurisé' : 'Données custom'}
                            </div>
                        </div>

                        ${config.custom_message ? `<div class="custom-message">${config.custom_message}</div>` : ''}
                    </div>
                </div>

                ${config.app_logo && config.app_logo !== '' ?
                    `<img src="/public/${config.app_logo}" class="footer-logo" alt="Logo"/>` : ''}
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
            
            // Debug: Log the customizations data
            console.log('Ticket customizations from DB:', ticketData.customizations);
            console.log('Template data from DB:', ticketData.template_data);
            
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
            
            console.log('Merged template config:', templateConfig);

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
                'UPDATE booking_tickets SET pdf_generated_at = NOW(), pdf_file_url = $1 WHERE id = $2',
                [pdfUrl, ticketId]
            );

            console.log(`Generated PDF ticket: ${pdfPath}`);
            return {
                success: true,
                pdfPath,
                pdfUrl,
                fileName: pdfFileName
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
                        ticketId: ticket.id,
                        error: error.message
                    });
                }
            }

            return results;

        } finally {
            client.release();
        }
    }

    /**
     * Clean up browser instance
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export default new PDFTicketService();
