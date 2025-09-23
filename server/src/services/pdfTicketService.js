import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import pool from '../db.js';

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
            const launchOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            };

            // In production (Docker), specify Chrome executable path
            if (process.env.NODE_ENV === 'production') {
                launchOptions.executablePath = '/usr/bin/google-chrome-stable';
            }

            try {
                this.browser = await puppeteer.launch(launchOptions);
                console.log('✅ Puppeteer browser initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize Puppeteer browser:', error.message);

                // Try alternative Chrome paths in production
                if (process.env.NODE_ENV === 'production') {
                    const alternativePaths = [
                        '/usr/bin/chromium',
                        '/usr/bin/chromium-browser',
                        '/usr/bin/google-chrome',
                        '/opt/google/chrome/google-chrome'
                    ];

                    for (const chromePath of alternativePaths) {
                        try {
                            launchOptions.executablePath = chromePath;
                            this.browser = await puppeteer.launch(launchOptions);
                            console.log(`✅ Chrome found at: ${chromePath}`);
                            break;
                        } catch (altError) {
                            console.log(`❌ Chrome not found at: ${chromePath}`);
                        }
                    }
                }

                if (!this.browser) {
                    throw new Error('Could not initialize Chrome browser for PDF generation');
                }
            }
        }
        return this.browser;
    }

    /**
     * Convert image to base64 data URL
     */
    async imageToBase64(imagePath) {
        try {
            const imageBuffer = await fs.readFile(imagePath);
            const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
            return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return null;
        }
    }

    /**
     * Load external template files
     */
    async loadTemplate() {
        try {
            // Check if running from project root or server directory
            const isFromRoot = process.cwd().endsWith('be-out-apps');
            const basePath = isFromRoot ? 'server/src/templates' : 'src/templates';

            const cssPath = path.join(process.cwd(), basePath, 'ticket-template.css');
            const htmlPath = path.join(process.cwd(), basePath, 'ticket-template.html');

            console.log('🔍 Looking for templates at:', cssPath);

            const cssContent = await fs.readFile(cssPath, 'utf-8');
            const htmlTemplate = await fs.readFile(htmlPath, 'utf-8');

            return { cssContent, htmlTemplate };
        } catch (error) {
            console.error('Error loading template files:', error);
            throw new Error('Template files not found');
        }
    }

    /**
     * Process template with data
     */
    processTemplate(template, data) {
        let processed = template;

        // Simple template replacement
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = data[key] || '';
            processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });

        // Handle conditional blocks
        processed = processed.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, condition, content) => {
            return data[condition] ? content : '';
        });

        return processed;
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
     * Generate QR Code
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
            throw new Error('QR code generation failed');
        }
    }

    /**
     * Get QR code content based on type
     */
    getQRCodeContent(qrType, ticketData, customData = null, templateConfig = null) {
        const baseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

        switch (qrType) {
            case 'booking_reference':
                return ticketData.ticket_number || ticketData.booking_reference;
            case 'ticket_hash':
                return crypto.createHash('sha256').update(ticketData.ticket_number + ticketData.booking_reference).digest('hex').substring(0, 16);
            case 'prefixed_number':
                const prefix = templateConfig?.qr_prefix || 'BE';
                return `${prefix}-${ticketData.ticket_number}`;
            case 'json_data':
                return JSON.stringify({
                    ticket: ticketData.ticket_number,
                    booking: ticketData.booking_reference,
                    event: ticketData.event_id
                });
            case 'custom_data':
                return customData || ticketData.ticket_number;
            case 'simple_url':
                const customUrl = templateConfig?.qr_custom_url || `${baseUrl}/ticket/${ticketData.id}`;
                return customUrl;
            default:
                return ticketData.ticket_number;
        }
    }

    /**
     * Generate HTML template for ticket using external templates
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

        console.log('🎫 PDF Template Config:', {
            ticket_size: config.ticket_size,
            primary_color: config.primary_color,
            qr_code_type: config.qr_code_type,
            has_background_image: !!config.background_image,
            has_app_logo: !!config.app_logo
        });

        // Generate QR code
        const qrContent = this.getQRCodeContent(config.qr_code_type, ticketData, config.qr_custom_data, templateConfig);
        console.log('Generated QR content:', qrContent, 'for type:', config.qr_code_type);
        const qrCodeDataURL = await this.generateQRCode(qrContent);

        // Convert logo to base64 if it exists
        let logoBase64 = null;
        if (config.app_logo && config.app_logo !== '') {
            // Determine the correct path based on environment
            let logoPath;
            if (process.env.NODE_ENV === 'production') {
                // In Docker deployment, files are in /app
                logoPath = path.join('/app/public', config.app_logo);
            } else {
                // Local development
                const isFromRoot = process.cwd().endsWith('be-out-apps');
                const basePath = isFromRoot ? 'server/public' : 'public';
                logoPath = path.join(process.cwd(), basePath, config.app_logo);
            }

            console.log('🖼️ Looking for logo at:', logoPath);
            logoBase64 = await this.imageToBase64(logoPath);
            console.log('🖼️ Logo base64 result:', logoBase64 ? 'SUCCESS' : 'FAILED');
        }

        // Format date and time
        const eventDate = new Date(eventData.event_date);
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Load templates
        const { cssContent, htmlTemplate } = await this.loadTemplate();

        // Prepare template data
        const templateData = {
            CSS_CONTENT: cssContent,
            TICKET_SIZE_CLASS: config.ticket_size === 'half-a4' ? 'half-a4' : config.ticket_size === 'quarter-a4' ? 'quarter-a4' : '',
            PRIMARY_COLOR: config.primary_color,
            SECONDARY_COLOR: config.secondary_color,
            BACKGROUND_IMAGE: config.background_image,
            EVENT_TITLE: eventData.title,
            EVENT_CATEGORY: eventData.category_name,
            FORMATTED_DATE: formattedDate,
            FORMATTED_TIME: formattedTime,
            EVENT_LOCATION: eventData.location || eventData.formatted_address || 'Lieu à confirmer',
            QR_CODE_DATA_URL: qrCodeDataURL,
            TICKET_NUMBER: ticketData.ticket_number,
            CUSTOM_MESSAGE: config.custom_message,
            APP_LOGO: logoBase64
        };

        // Process template
        return this.processTemplate(htmlTemplate, templateData);
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
                    qrSize: 60,
                    fontScale: 0.7
                };
            case 'a4':
            default:
                return {
                    width: 210,
                    height: 297,
                    layout: 'standard',
                    qrSize: 100,
                    fontScale: 1.0
                };
        }
    }

    /**
     * Generate ticket PDF
     */
    async generateTicketPDF(ticketId) {
        const client = await pool.connect();

        try {
            console.log('Generating PDF for ticket:', ticketId);

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
                event_time: ticketData.event_date,
                location: ticketData.venue_name || 'Lieu à confirmer',
                formatted_address: ticketData.venue_name || 'Adresse à confirmer',
                category_name: ticketData.category_name
            };

            console.log('🎫 Event Data for PDF:', {
                title: eventData.title,
                location: eventData.location,
                venue_name: ticketData.venue_name,
                category_name: eventData.category_name,
                event_date: eventData.event_date
            });

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

            const dimensions = this.getTicketDimensions(templateConfig?.ticket_size || 'a4');

            await page.pdf({
                path: pdfPath,
                width: `${dimensions.width}mm`,
                height: `${dimensions.height}mm`,
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }
            });

            await page.close();

            // Update database with PDF path
            await client.query(
                'UPDATE booking_tickets SET pdf_file_url = $1, pdf_generated_at = NOW() WHERE id = $2',
                [`/uploads/tickets/${pdfFileName}`, ticketId]
            );

            return {
                success: true,
                pdfPath: pdfPath,
                fileName: pdfFileName,
                url: `/uploads/tickets/${pdfFileName}`
            };

        } catch (error) {
            console.error('Error generating ticket PDF:', error);
            return {
                success: false,
                error: error.message
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
            const ticketsQuery = 'SELECT id FROM booking_tickets WHERE booking_id = $1';
            const ticketsResult = await client.query(ticketsQuery, [bookingId]);

            const results = [];

            for (const ticket of ticketsResult.rows) {
                const result = await this.generateTicketPDF(ticket.id);
                results.push({
                    ticketId: ticket.id,
                    ...result
                });
            }

            return results;

        } catch (error) {
            console.error('Error generating booking tickets PDFs:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export default new PDFTicketService();
