import React from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Paper,
    Divider,
    Chip,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TicketPreview = ({ formData, venues, categories, templates }) => {
    const { t } = useTranslation();

    // Get event details
    const eventDetails = formData?.eventDetails || {};
    const venueData = formData?.venue || {};
    const ticketConfig = formData?.ticketConfig?.customizations || {};

    // Find venue and category details
    const venue = venues.find(v => v.id === venueData.venue_id);
    const category = categories.find(c => c.id === eventDetails.category_id);
    const template = templates.find(t => t.id === formData?.ticketConfig?.template_id);

    // Get configuration values with defaults
    const primaryColor = ticketConfig.primary_color || '#1976d2';
    const secondaryColor = ticketConfig.secondary_color || '#9c27b0';
    const qrCodeType = ticketConfig.qr_code_type || 'verification_url';
    const customMessage = ticketConfig.custom_text || ''; // Fixed: use custom_text field
    const backgroundImage = ticketConfig.background_image;
    const appLogo = ticketConfig.app_logo || 'be-out_logo_noir.png';

    // A5 format configuration (simplified - only A5 format)
    const dimensions = {
        maxWidth: 400,
        layout: 'standard',
        fontScale: 0.9,
        qrSize: 120
    };

    // Generate responsive styling based on ticket size
    const getResponsiveStyles = () => {
        const { fontScale } = dimensions;
        return {
            h6: { fontSize: `${1.25 * fontScale}rem`, lineHeight: 1.2 },
            body1: { fontSize: `${1 * fontScale}rem`, lineHeight: 1.3 },
            body2: { fontSize: `${0.875 * fontScale}rem`, lineHeight: 1.3 },
            caption: { fontSize: `${0.75 * fontScale}rem`, lineHeight: 1.2 },
            small: { fontSize: `${0.6 * fontScale}rem`, lineHeight: 1.1 },
        };
    };

    const responsiveStyles = getResponsiveStyles();

    // Generate dynamic sample ticket data based on QR configuration
    const generateSampleTicketNumber = () => {
        if (qrCodeType === 'booking_reference' && ticketConfig.qr_booking_format) {
            // Use the same placeholders as QR code generation
            const sampleTicketNumber = 'BO20250924001234-001-5678901';
            const placeholders = {
                '{ticket_number}': sampleTicketNumber,
                '{booking_id}': '1234',
                '{booking_reference}': 'BO20250924001234',
                '{event_title}': eventDetails.title || 'Sample Event',
                '{event_date}': eventDetails.event_date ? format(new Date(eventDetails.event_date), 'dd/MM/yyyy') : '01/01/2024',
                '{venue_name}': venue?.name || 'Sample Venue'
            };

            let result = ticketConfig.qr_booking_format;
            Object.entries(placeholders).forEach(([placeholder, value]) => {
                result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            });
            return result;
        }
        return 'BO20250924001234-001-5678901';
    };

    // Sample ticket data
    const sampleTicketData = {
        ticketNumber: generateSampleTicketNumber(),
        purchaseDate: new Date().toISOString(),
        holderName: 'Nom du porteur',
        validationCode: 'VLD-789012',
    };

    // Generate QR code content based on type and configuration
    const getQRCodeContent = () => {
        const baseUrl = 'https://be-out.app';

        // Sample data for preview
        const sampleBookingId = '1234';
        const sampleBookingReference = 'BO20250924001234-001-5678901';

        // Generate placeholders for replacement
        const sampleTicketNumber = 'BO20250924001234-001-5678901';
        const placeholders = {
            '{ticket_number}': sampleTicketNumber,
            '{booking_id}': sampleBookingId,
            '{booking_reference}': sampleBookingReference,
            '{event_title}': eventDetails.title || 'Sample Event',
            '{event_date}': eventDetails.event_date ? format(new Date(eventDetails.event_date), 'dd/MM/yyyy') : '01/01/2024',
            '{venue_name}': venue?.name || 'Sample Venue'
        };

        // Helper function to replace placeholders in text
        const replacePlaceholders = (text) => {
            let result = text || '';
            Object.entries(placeholders).forEach(([placeholder, value]) => {
                result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            });
            return result;
        };

        switch (qrCodeType) {
            case 'verification_url':
                const verificationUrl = ticketConfig.qr_verification_url || `${baseUrl}/verify/{booking_reference}`;
                return replacePlaceholders(verificationUrl);

            case 'booking_reference':
                const bookingFormat = ticketConfig.qr_booking_format || '{booking_id}';
                return replacePlaceholders(bookingFormat);

            case 'event_details':
                const eventDetails = ticketConfig.qr_event_details || JSON.stringify({
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
    };

    // Early return if no event title
    if (!eventDetails.title) {
        return (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary">
                    {t('Aperçu du billet')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('Remplissez les détails de l\'événement pour voir l\'aperçu')}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={3}
            sx={{
                p: 0,
                overflow: 'visible',
                width: dimensions.maxWidth,
                height: dimensions.maxWidth * 1.414, // Fixed height based on A5 ratio
                mx: 'auto',
                bgcolor: 'white',
                border: '2px dashed',
                borderColor: primaryColor,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Background overlay for readability when background image is present */}
            {backgroundImage && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        zIndex: 1,
                    }}
                />
            )}

            {/* Header Section */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    color: 'white',
                    p: 1.5,
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        ...responsiveStyles.h6
                    }}
                >
                    {eventDetails.title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        opacity: 0.9,
                        ...responsiveStyles.body2
                    }}
                >
                    BILLET D'ENTRÉE
                </Typography>
                {/* Format indicator */}
                <Chip
                    label="A5"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        ...responsiveStyles.small,
                    }}
                />
            </Box>

            {/* Event Info Section */}
            <Box sx={{ p: 2, position: 'relative', zIndex: 2, flex: 1 }}>
                {/* Main content with image on left and details on right */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {/* Event Image - Left side */}
                    {(ticketConfig.use_event_image !== false && (formData?.eventImagePreview || eventDetails.image_url)) && (
                        <Box sx={{ flexShrink: 0 }}>
                            <img
                                src={formData?.eventImagePreview || eventDetails.image_url}
                                alt={eventDetails.title}
                                style={{
                                    width: '150px',
                                    height: '112px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '2px solid #e0e0e0'
                                }}
                            />
                        </Box>
                    )}

                    {/* Event Details - Right side */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Date and Time */}
                        {eventDetails.event_date && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ...responsiveStyles.small, fontWeight: 'bold' }}
                                >
                                    DATE & HEURE
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 'medium', ...responsiveStyles.body1 }}
                                >
                                    {format(new Date(eventDetails.event_date), 'dd MMM yyyy', { locale: fr })}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={responsiveStyles.body2}
                                >
                                    {format(new Date(eventDetails.event_date), 'HH:mm')}
                                </Typography>
                            </Box>
                        )}

                        {/* Venue */}
                        {venue && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ...responsiveStyles.small, fontWeight: 'bold' }}
                                >
                                    LIEU
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 'medium', ...responsiveStyles.body1 }}
                                >
                                    {venue.name}
                                </Typography>
                                {venue.address && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={responsiveStyles.body2}
                                    >
                                        {venue.city || venue.address.split(',')[0]}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Category and Price in a row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            {category && (
                                <Chip
                                    label={category.name}
                                    size="small"
                                    sx={{
                                        bgcolor: primaryColor,
                                        color: 'white',
                                        ...responsiveStyles.small,
                                    }}
                                />
                            )}
                            {eventDetails.price && (
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 'bold', color: primaryColor, ...responsiveStyles.h6 }}
                                >
                                    {eventDetails.price}€
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Ticket Details Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ maxWidth: '55%', flex: '1' }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ...responsiveStyles.small, fontWeight: 'bold' }}
                        >
                            N° BILLET
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 'medium',
                                fontFamily: 'monospace',
                                ...responsiveStyles.body1,
                                wordBreak: 'break-all',
                                lineHeight: 1.2
                            }}
                        >
                            {getQRCodeContent()}
                        </Typography>

                        {/* Purchase Date */}
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, ...responsiveStyles.small }}
                        >
                            Acheté le {format(new Date(sampleTicketData.purchaseDate), 'dd/MM/yy HH:mm')}
                        </Typography>
                    </Box>

                    {/* QR Code */}
                    <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                        <QRCodeSVG
                            value={getQRCodeContent()}
                            size={dimensions.qrSize}
                            level="M"
                            includeMargin={false}
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', ...responsiveStyles.small, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: dimensions.qrSize }}
                        >
                            {getQRCodeContent().length > 30
                                ? `${getQRCodeContent().substring(0, 30)}...`
                                : getQRCodeContent()
                            }
                        </Typography>
                    </Box>
                </Box>

                {/* Custom Message */}
                {customMessage && (
                    <Box sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1
                    }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontStyle: 'italic',
                                textAlign: 'center',
                                ...responsiveStyles.body2
                            }}
                        >
                            {customMessage}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    bgcolor: 'grey.100',
                    p: 1,
                    textAlign: 'center',
                    borderTop: '1px solid',
                    borderColor: 'grey.300',
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    marginTop: 'auto', // Push footer to bottom
                }}
            >
                {appLogo && (
                    <img
                        src={`/${appLogo}`}
                        alt="Be-Out Logo"
                        style={{
                            height: 24,
                            width: 'auto',
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={responsiveStyles.body2}
                >
                    Be-Out • Votre ticket pour sortir
                </Typography>
            </Box>

            {/* Template Info */}
            {template && (
                <Box sx={{
                    p: 1,
                    bgcolor: primaryColor,
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <Typography
                        variant="caption"
                        sx={responsiveStyles.caption}
                    >
                        Modèle: {template.name}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default TicketPreview;
