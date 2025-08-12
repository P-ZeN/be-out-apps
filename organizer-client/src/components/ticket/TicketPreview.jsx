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

    // Ticket size options
    const ticketSizes = [
        { id: 'a4', name: 'A4', description: 'Format standard complet' },
        { id: 'half-a4', name: '1/2 A4', description: 'Format paysage' },
        { id: 'quarter-a4', name: '1/4 A4', description: 'Format ticket compact' },
    ];

    // Get event details
    const eventDetails = formData?.eventDetails || {};
    const venueData = formData?.venue || {};
    const ticketConfig = formData?.customizations || {};

    // Find venue and category details
    const venue = venues.find(v => v.id === venueData.venue_id);
    const category = categories.find(c => c.id === eventDetails.category_id);
    const template = templates.find(t => t.id === ticketConfig.template_id);

    // Get configuration values with defaults
    const ticketSize = ticketConfig.ticket_size || 'a4';
    const primaryColor = ticketConfig.primary_color || '#1976d2';
    const secondaryColor = ticketConfig.secondary_color || '#9c27b0';
    const qrCodeType = ticketConfig.qr_code_type || 'verification_url';
    const customMessage = ticketConfig.custom_message || '';
    const backgroundImage = ticketConfig.background_image;
    const appLogo = ticketConfig.app_logo || 'be-out_logo_noir.png';

    // Ticket dimensions and layout configuration
    const getTicketDimensions = (size) => {
        switch (size) {
            case 'half-a4':
                return { 
                    maxWidth: 600, 
                    aspectRatio: 210/148,
                    layout: 'twoColumn',
                    fontScale: 0.9,
                    qrSize: 80
                };
            case 'quarter-a4':
                return { 
                    maxWidth: 300, 
                    aspectRatio: 'auto', // Let content determine height
                    layout: 'compact',
                    fontScale: 0.7,
                    qrSize: 70
                };
            default: // 'a4'
                return { 
                    maxWidth: 400, 
                    aspectRatio: 210/297,
                    layout: 'standard',
                    fontScale: 1,
                    qrSize: 90
                };
        }
    };

    const dimensions = getTicketDimensions(ticketSize);

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

    // Sample ticket data
    const sampleTicketData = {
        ticketNumber: 'BE-2024-001234',
        purchaseDate: new Date().toISOString(),
        holderName: 'Nom du porteur',
        validationCode: 'VLD-789012',
    };

    // Generate QR code content based on type
    const getQRCodeContent = () => {
        const baseUrl = 'https://be-out.app';
        const ticketId = sampleTicketData.ticketNumber;
        
        switch (qrCodeType) {
            case 'verification_url':
                return `${baseUrl}/verify/${ticketId}`;
            case 'booking_reference':
                return ticketId;
            case 'ticket_hash':
                return `${ticketId}-${sampleTicketData.validationCode}`;
            case 'custom_data':
                return JSON.stringify({
                    ticket: ticketId,
                    event: eventDetails.title,
                    date: eventDetails.event_date,
                    venue: venue?.name
                });
            default:
                return `${baseUrl}/ticket/${ticketId}`;
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
                overflow: 'hidden',
                maxWidth: dimensions.maxWidth,
                mx: 'auto',
                bgcolor: 'white',
                border: '2px dashed',
                borderColor: primaryColor,
                aspectRatio: dimensions.aspectRatio,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
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
                    p: dimensions.layout === 'compact' ? 1 : 2,
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
                {/* Ticket size indicator */}
                <Chip
                    label={ticketSizes.find(s => s.id === ticketSize)?.name || 'A4'}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: dimensions.layout === 'compact' ? 4 : 8,
                        right: dimensions.layout === 'compact' ? 4 : 8,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        ...responsiveStyles.small,
                    }}
                />
            </Box>

            {/* Event Info Section */}
            <Box sx={{ p: dimensions.layout === 'compact' ? 1 : 2, position: 'relative', zIndex: 2 }}>
                {dimensions.layout === 'twoColumn' ? (
                    // Two-column layout for 1/2 A4: Left (date, venue, price) | Right (ticket number, QR)
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {/* Left Column - Event Details */}
                        <Box>
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

                            {/* Price */}
                            {eventDetails.price && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ ...responsiveStyles.small, fontWeight: 'bold' }}
                                    >
                                        PRIX
                                    </Typography>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ fontWeight: 'bold', color: primaryColor, ...responsiveStyles.h6 }}
                                    >
                                        {eventDetails.price}€
                                    </Typography>
                                </Box>
                            )}

                            {/* Category */}
                            {category && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Chip
                                        label={category.name}
                                        size="small"
                                        sx={{
                                            bgcolor: primaryColor,
                                            color: 'white',
                                            ...responsiveStyles.small,
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>

                        {/* Right Column - Ticket Info & QR */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                            {/* Ticket Number */}
                            <Box sx={{ textAlign: 'center' }}>
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
                                        ...responsiveStyles.body1
                                    }}
                                >
                                    {sampleTicketData.ticketNumber}
                                </Typography>
                            </Box>

                            {/* QR Code */}
                            <Box sx={{ textAlign: 'center' }}>
                                <QRCodeSVG
                                    value={getQRCodeContent()}
                                    size={dimensions.qrSize}
                                    level="M"
                                    includeMargin={false}
                                />
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ display: 'block', mt: 0.5, ...responsiveStyles.caption }}
                                >
                                    QR CODE
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ display: 'block', ...responsiveStyles.small }}
                                >
                                    {qrCodeType === 'verification_url' && 'URL Vérification'}
                                    {qrCodeType === 'booking_reference' && 'Référence'}
                                    {qrCodeType === 'ticket_hash' && 'Hash Sécurisé'}
                                    {qrCodeType === 'custom_data' && 'Données Custom'}
                                </Typography>
                            </Box>

                            {/* Purchase Date */}
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    textAlign: 'center',
                                    ...responsiveStyles.small
                                }}
                            >
                                Acheté le {format(new Date(sampleTicketData.purchaseDate), 'dd/MM/yy HH:mm')}
                            </Typography>

                            {/* Custom Message for 1/2 A4 */}
                            {customMessage && (
                                <Box sx={{ 
                                    mt: 1, 
                                    p: 0.5, 
                                    bgcolor: 'grey.50', 
                                    borderRadius: 1,
                                    textAlign: 'center'
                                }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontStyle: 'italic',
                                            ...responsiveStyles.body2
                                        }}
                                    >
                                        {customMessage}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : (
                    // Standard single-column layout for A4 and compact layout for 1/4 A4
                    <>
                        <Box>
                            {/* Date and Time */}
                            {eventDetails.event_date && (
                                <Box sx={{ mb: dimensions.layout === 'compact' ? 1 : 2 }}>
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
                                        {format(new Date(eventDetails.event_date), 
                                            dimensions.layout === 'compact' ? 'dd/MM/yy' : 'dd MMMM yyyy', 
                                            { locale: fr }
                                        )}
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
                                <Box sx={{ mb: dimensions.layout === 'compact' ? 1 : 2 }}>
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
                                            {dimensions.layout === 'compact' ? 
                                                venue.city || venue.address.split(',')[0] : 
                                                `${venue.address}${venue.city ? `, ${venue.city}` : ''}`
                                            }
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Category and Price in a row for compact layout */}
                            {dimensions.layout === 'compact' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                            ) : (
                                <>
                                    {/* Category */}
                                    {category && (
                                        <Box sx={{ mb: 2 }}>
                                            <Chip
                                                label={category.name}
                                                size="small"
                                                sx={{
                                                    bgcolor: primaryColor,
                                                    color: 'white',
                                                    ...responsiveStyles.small,
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {/* Price */}
                                    {eventDetails.price && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary" 
                                                sx={{ ...responsiveStyles.small, fontWeight: 'bold' }}
                                            >
                                                PRIX
                                            </Typography>
                                            <Typography 
                                                variant="h6" 
                                                sx={{ fontWeight: 'bold', color: primaryColor, ...responsiveStyles.h6 }}
                                            >
                                                {eventDetails.price}€
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>

                        <Divider sx={{ mx: dimensions.layout === 'compact' ? 1 : 2 }} />

                        {/* Ticket Details Section */}
                        <Box sx={{ p: dimensions.layout === 'compact' ? 1 : 2, position: 'relative', zIndex: 2 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: dimensions.layout === 'compact' ? 'flex-start' : 'center', 
                                mb: dimensions.layout === 'compact' ? 1 : 2,
                                flexDirection: dimensions.layout === 'compact' ? 'column' : 'row',
                                gap: dimensions.layout === 'compact' ? 1 : 0
                            }}>
                                <Box>
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
                                            ...responsiveStyles.body1
                                        }}
                                    >
                                        {sampleTicketData.ticketNumber}
                                    </Typography>
                                </Box>

                                {/* QR Code */}
                                <Box sx={{ 
                                    textAlign: 'center',
                                    alignSelf: dimensions.layout === 'compact' ? 'center' : 'auto'
                                }}>
                                    <QRCodeSVG
                                        value={getQRCodeContent()}
                                        size={dimensions.qrSize}
                                        level="M"
                                        includeMargin={false}
                                    />
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        sx={{ display: 'block', mt: 0.5, ...responsiveStyles.caption }}
                                    >
                                        QR CODE
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        sx={{ display: 'block', ...responsiveStyles.small }}
                                    >
                                        {qrCodeType === 'verification_url' && 'URL Vérification'}
                                        {qrCodeType === 'booking_reference' && 'Référence'}
                                        {qrCodeType === 'ticket_hash' && 'Hash Sécurisé'}
                                        {qrCodeType === 'custom_data' && 'Données Custom'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Purchase Date */}
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    mb: 1,
                                    ...responsiveStyles.small
                                }}
                            >
                                Acheté le {format(new Date(sampleTicketData.purchaseDate), 
                                    dimensions.layout === 'compact' ? 'dd/MM/yy HH:mm' : 'dd/MM/yyyy HH:mm'
                                )}
                            </Typography>

                            {/* Custom Message */}
                            {customMessage && (
                                <Box sx={{ 
                                    mt: dimensions.layout === 'compact' ? 1 : 2, 
                                    p: dimensions.layout === 'compact' ? 0.5 : 1, 
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
                    </>
                )}
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    bgcolor: 'grey.100',
                    p: dimensions.layout === 'compact' ? 0.5 : 1,
                    textAlign: 'center',
                    borderTop: '1px solid',
                    borderColor: 'grey.300',
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: dimensions.layout === 'compact' ? 0.5 : 1,
                }}
            >
                {appLogo && (
                    <img
                        src={`/${appLogo}`}
                        alt="Be-Out Logo"
                        style={{
                            height: dimensions.layout === 'compact' ? 12 : 16,
                            width: 'auto',
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}
                <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={responsiveStyles.caption}
                >
                    {dimensions.layout === 'compact' ? 'Be-Out' : 'Be-Out • Votre ticket pour sortir'}
                </Typography>
            </Box>

            {/* Template Info */}
            {template && (
                <Box sx={{ 
                    p: dimensions.layout === 'compact' ? 0.5 : 1, 
                    bgcolor: primaryColor, 
                    color: 'white', 
                    textAlign: 'center' 
                }}>
                    <Typography 
                        variant="caption"
                        sx={responsiveStyles.caption}
                    >
                        {dimensions.layout === 'compact' ? template.name : `Modèle: ${template.name}`}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default TicketPreview;
