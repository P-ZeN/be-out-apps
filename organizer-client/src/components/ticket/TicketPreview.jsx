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
    const ticketConfig = formData?.ticketConfig || {};

    // Find venue and category details
    const venue = venues.find(v => v.id === venueData.venue_id);
    const category = categories.find(c => c.id === eventDetails.category_id);
    const template = templates.find(t => t.id === ticketConfig.template_id);

    // Get customizations
    const customizations = ticketConfig.customizations || {};
    const primaryColor = customizations.primary_color || '#1976d2';
    const secondaryColor = customizations.secondary_color || '#f50057';
    const customMessage = customizations.custom_message || '';

    // Generate sample ticket data
    const sampleTicketData = {
        ticketNumber: 'BE-OUT-001234',
        qrCode: `${eventDetails.title}-BE-OUT-001234`,
        price: eventDetails.price || '0',
        purchaseDate: new Date().toISOString(),
    };

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
                maxWidth: 400,
                mx: 'auto',
                bgcolor: 'white',
                border: '2px dashed',
                borderColor: primaryColor,
            }}
        >
            {/* Header Section */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    color: 'white',
                    p: 2,
                    textAlign: 'center',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {eventDetails.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    BILLET D'ENTRÉE
                </Typography>
            </Box>

            {/* Event Info Section */}
            <Box sx={{ p: 2 }}>
                {/* Date and Time */}
                {eventDetails.event_date && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            DATE & HEURE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {format(new Date(eventDetails.event_date), 'dd MMMM yyyy', { locale: fr })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {format(new Date(eventDetails.event_date), 'HH:mm')}
                        </Typography>
                    </Box>
                )}

                {/* Venue */}
                {venue && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            LIEU
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {venue.name}
                        </Typography>
                        {venue.address && (
                            <Typography variant="body2" color="text.secondary">
                                {venue.address}
                                {venue.city && `, ${venue.city}`}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Category */}
                {category && (
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            label={category.name}
                            size="small"
                            sx={{
                                bgcolor: primaryColor,
                                color: 'white',
                                fontSize: '0.7rem',
                            }}
                        />
                    </Box>
                )}

                {/* Price */}
                {eventDetails.price && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            PRIX
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                            {eventDetails.price}€
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider sx={{ mx: 2 }} />

            {/* Ticket Details Section */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            N° BILLET
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', fontFamily: 'monospace' }}>
                            {sampleTicketData.ticketNumber}
                        </Typography>
                    </Box>

                    {/* QR Code */}
                    <Box sx={{ textAlign: 'center' }}>
                        <QRCodeSVG
                            value={sampleTicketData.qrCode}
                            size={60}
                            level="M"
                            includeMargin={false}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            QR CODE
                        </Typography>
                    </Box>
                </Box>

                {/* Purchase Date */}
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 1 }}>
                    Acheté le {format(new Date(sampleTicketData.purchaseDate), 'dd/MM/yyyy HH:mm')}
                </Typography>

                {/* Custom Message */}
                {customMessage && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
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
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Be-Out • Votre ticket pour sortir
                </Typography>
            </Box>

            {/* Template Info */}
            {template && (
                <Box sx={{ p: 1, bgcolor: primaryColor, color: 'white', textAlign: 'center' }}>
                    <Typography variant="caption">
                        Modèle: {template.name}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default TicketPreview;
