import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import pool from '../db.js';
import fetch from 'node-fetch';

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
            const result = data[condition] ? content : '';
            if (condition === 'has_background_image') {
                console.log(`🖼️ Background Image: ${result ? 'INCLUDED' : 'EXCLUDED'} (${data.BACKGROUND_IMAGE ? data.BACKGROUND_IMAGE.length + ' chars' : 'none'})`);
            }
            return result;
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
     * Get QR code content based on type - matching React preview logic
     */
    getQRCodeContent(qrType, ticketData, templateConfig = null, eventData = null) {
        const baseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

        // Create placeholders for replacement (matching React preview logic)
        const placeholders = {
            '{ticket_number}': ticketData.ticket_number,
            '{booking_id}': ticketData.booking_id,
            '{booking_reference}': ticketData.booking_reference,
            '{event_title}': eventData?.title || 'Sample Event',
            '{event_date}': eventData?.event_date ? new Date(eventData.event_date).toLocaleDateString('fr-FR') : '01/01/2024',
            '{venue_name}': eventData?.location || 'Sample Venue'
        };

        // Helper function to replace placeholders in text
        const replacePlaceholders = (text) => {
            let result = text || '';
            Object.entries(placeholders).forEach(([placeholder, value]) => {
                result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            });
            return result;
        };

        switch (qrType) {
            case 'verification_url':
                const verificationUrl = templateConfig?.qr_verification_url || `${baseUrl}/verify/{booking_reference}`;
                return replacePlaceholders(verificationUrl);

            case 'booking_reference':
                const bookingFormat = templateConfig?.qr_booking_format || '{ticket_number}';
                return replacePlaceholders(bookingFormat);

            case 'event_details':
                const eventDetails = templateConfig?.qr_event_details || JSON.stringify({
                    event: '{event_title}',
                    date: '{event_date}',
                    venue: '{venue_name}',
                    booking: '{booking_reference}'
                });
                try {
                    // Try to parse as JSON and replace placeholders in the parsed object
                    const parsed = JSON.parse(eventDetails);
                    const processObject = (obj) => {
                        if (typeof obj === 'string') {
                            return replacePlaceholders(obj);
                        } else if (Array.isArray(obj)) {
                            return obj.map(processObject);
                        } else if (typeof obj === 'object' && obj !== null) {
                            const result = {};
                            Object.entries(obj).forEach(([key, value]) => {
                                result[key] = processObject(value);
                            });
                            return result;
                        }
                        return obj;
                    };
                    return JSON.stringify(processObject(parsed), null, 2);
                } catch (e) {
                    // If not valid JSON, treat as plain text
                    return replacePlaceholders(eventDetails);
                }

            default:
                return replacePlaceholders('{booking_reference}');
        }
    }

    /**
     * Generate HTML template for ticket using external templates
     */
    async generateTicketHTML(ticketData, eventData, templateConfig = null) {
        // Get template configuration with defaults
        const config = {
            ticket_size: templateConfig?.ticket_size || 'A5',
            primary_color: templateConfig?.primary_color || '#1976d2',
            secondary_color: templateConfig?.secondary_color || '#9c27b0',
            background_image: templateConfig?.background_image || null,
            app_logo: templateConfig?.app_logo || 'be-out_logo_noir.png',
            custom_message: templateConfig?.custom_text || templateConfig?.custom_message || '', // Fixed: use custom_text first
            qr_code_type: templateConfig?.qr_code_type || 'booking_reference',
            qr_custom_data: templateConfig?.qr_custom_data || null
        };

        console.log(`🎫 PDF Config: ${config.ticket_size}, QR: ${config.qr_code_type}, BG: ${config.background_image ? 'YES' : 'NO'}`);

        console.log('🎫 Ticket Data for PDF:', {
            ticket_number: ticketData.ticket_number,
            booking_reference: ticketData.booking_reference,
            booking_id: ticketData.booking_id || ticketData.id
        });

        // Generate QR code
        const qrContent = this.getQRCodeContent(config.qr_code_type, ticketData, templateConfig, eventData);
        console.log(`🔗 QR Code: ${config.qr_code_type} (${qrContent.length} chars)`);
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

        // Handle event image
        let eventImageBase64 = null;
        if (eventData.image_url) {
            try {
                if (eventData.image_url.startsWith('http')) {
                    // For remote images, fetch them first
                    console.log('Remote image URL detected:', eventData.image_url);
                    try {
                        const response = await fetch(eventData.image_url);
                        if (response.ok) {
                            const buffer = await response.arrayBuffer();
                            const base64 = Buffer.from(buffer).toString('base64');
                            const mimeType = response.headers.get('content-type') || 'image/jpeg';
                            eventImageBase64 = `data:${mimeType};base64,${base64}`;
                            console.log('🖼️ Remote image fetched successfully');
                        } else {
                            console.log('🖼️ Failed to fetch remote image:', response.status);
                        }
                    } catch (fetchError) {
                        console.log('🖼️ Error fetching remote image:', fetchError.message);
                    }
                } else {
                    // Local image path
                    const isFromRoot = process.cwd().endsWith('be-out-apps');
                    const basePath = isFromRoot ? 'server/uploads' : 'uploads';
                    const imagePath = path.join(process.cwd(), basePath, eventData.image_url);
                    console.log('🖼️ Looking for event image at:', imagePath);
                    eventImageBase64 = await this.imageToBase64(imagePath);
                    console.log('🖼️ Event image base64 result:', eventImageBase64 ? 'SUCCESS' : 'FAILED');
                }
            } catch (error) {
                console.log('Event image processing error:', error.message);
            }
        }

        // Format purchase date
        const purchaseDate = new Date(ticketData.created_at || ticketData.booking_date);
        const formattedPurchaseDate = purchaseDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }) + ' ' + purchaseDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get QR content preview (truncated for display)
        const qrContentPreview = qrContent.length > 30 ? qrContent.substring(0, 30) + '...' : qrContent;

        // Prepare template data with pricing tier information
        const templateData = {
            CSS_CONTENT: cssContent,
            TICKET_SIZE_CLASS: 'a5', // Always A5 now
            PRIMARY_COLOR: config.primary_color,
            SECONDARY_COLOR: config.secondary_color,
            BACKGROUND_IMAGE: config.background_image,
            EVENT_TITLE: eventData.title || 'Event Title',
            EVENT_CATEGORY: eventData.category_name || null,
            EVENT_IMAGE: eventImageBase64,
            EVENT_PRICE: eventData.price || null,
            // New pricing tier information
            PRICING_CATEGORY: ticketData.pricing_category_name || 'Standard',
            PRICING_TIER: ticketData.pricing_tier_name || 'Regular',
            TIER_PRICE: ticketData.tier_price || eventData.price || null,
            PRICING_CATEGORY_TIER: ticketData.pricing_category_name && ticketData.pricing_tier_name
                ? `${ticketData.pricing_category_name} - ${ticketData.pricing_tier_name}`
                : 'Standard - Regular',
            // Existing fields
            FORMATTED_DATE: formattedDate,
            FORMATTED_TIME: formattedTime,
            EVENT_LOCATION: eventData.location || eventData.formatted_address || 'Lieu à confirmer',
            QR_CODE_DATA_URL: qrCodeDataURL,
            QR_CONTENT_PREVIEW: qrContentPreview,
            TICKET_NUMBER: qrContent || 'N/A',
            PURCHASE_DATE: formattedPurchaseDate,
            CUSTOM_MESSAGE: config.custom_text || config.custom_message || null,
            APP_LOGO: logoBase64,
            has_background_image: !!config.background_image
        };

        console.log('🎫 Final Template Data:', {
            EVENT_TITLE: templateData.EVENT_TITLE,
            EVENT_PRICE: templateData.EVENT_PRICE,
            PRICING_CATEGORY: templateData.PRICING_CATEGORY,
            PRICING_TIER: templateData.PRICING_TIER,
            TIER_PRICE: templateData.TIER_PRICE,
            PRICING_CATEGORY_TIER: templateData.PRICING_CATEGORY_TIER,
            TICKET_NUMBER: templateData.TICKET_NUMBER,
            CUSTOM_MESSAGE: templateData.CUSTOM_MESSAGE,
            has_EVENT_IMAGE: !!templateData.EVENT_IMAGE,
            EVENT_IMAGE_length: templateData.EVENT_IMAGE ? templateData.EVENT_IMAGE.length : 0,
            has_background_image: templateData.has_background_image,
            BACKGROUND_IMAGE_length: templateData.BACKGROUND_IMAGE ? templateData.BACKGROUND_IMAGE.length : 0,
            QR_CONTENT_PREVIEW: templateData.QR_CONTENT_PREVIEW
        });

        // Process template
        const processedHTML = this.processTemplate(htmlTemplate, templateData);

        // Debug: check if placeholders are being replaced
        console.log('🎫 Template processing check:');
        console.log('- EVENT_TITLE placeholder exists:', htmlTemplate.includes('{{EVENT_TITLE}}'));
        console.log('- EVENT_TITLE replaced:', !processedHTML.includes('{{EVENT_TITLE}}'));
        console.log('- TICKET_NUMBER replaced:', !processedHTML.includes('{{TICKET_NUMBER}}'));
        console.log('- EVENT_PRICE replaced:', !processedHTML.includes('{{EVENT_PRICE}}'));
        console.log('🖼️ Background image in processed HTML:', processedHTML.includes('background-image'));

        // Log a snippet of the processed HTML around the background area
        const bgIndex = processedHTML.indexOf('background-image');
        if (bgIndex !== -1) {
            console.log('🔍 Background CSS HTML snippet:', processedHTML.substring(bgIndex - 50, bgIndex + 200));
        } else {
            console.log('❌ No background-image CSS found in processed HTML');
        }

        return processedHTML;
    }

    /**
     * Get ticket dimensions based on size
     */
    getTicketDimensions(size) {
        switch (size) {
            case 'A5':
                return {
                    width: 148,
                    height: 210,
                    layout: 'portrait',
                    qrSize: 80,
                    fontScale: 0.9
                };
            case 'quarter-A4':
                return {
                    width: 148,
                    height: 105,
                    layout: 'compact',
                    qrSize: 60,
                    fontScale: 0.7
                };
            case 'A4':
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
                    b.id as booking_id,
                    b.booking_reference,
                    b.user_id,
                    b.booking_date,
                    e.title as event_title,
                    e.event_date,
                    e.original_price,
                    e.discounted_price,
                    e.image_url,
                    e.customizations,
                    e.ticket_template_id,
                    v.name as venue_name,
                    va.formatted_address as venue_address,
                    va.locality as venue_city,
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
                LEFT JOIN address_relationships var ON (var.entity_type = 'venue' AND var.entity_id = v.id)
                LEFT JOIN addresses va ON va.id = var.address_id
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
                price: ticketData.discounted_price || ticketData.original_price, // Use discounted price if available
                image_url: ticketData.image_url,
                location: ticketData.venue_name || 'Lieu à confirmer',
                formatted_address: ticketData.venue_name || 'Adresse à confirmer',
                category_name: ticketData.category_name
            };

            console.log(`🎫 Event: "${eventData.title}" | Ticket: ${ticketData.ticket_number}`);

            // Debug template data summary
            console.log(`🎫 Template: ${ticketData.customizations?.ticket_size || 'default'}, BG: ${ticketData.customizations?.background_image ? 'YES' : 'NO'}`);

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

            // Always use A5 dimensions now
            await page.pdf({
                path: pdfPath,
                width: '148mm',  // A5 width
                height: '210mm', // A5 height
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
