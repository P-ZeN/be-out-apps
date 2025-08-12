import React from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Grid,
} from "@mui/material";

import VenueSelector from "../VenueSelector";

const VenueStep = ({ data, onChange, venues, onVenuesUpdate, onError, onSuccess }) => {
    const { t } = useTranslation();

    const handleVenueChange = (venueId) => {
        onChange({
            ...data,
            venue_id: venueId,
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {t('Lieu de l\'événement')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('Sélectionnez où se déroulera votre événement. Vous pouvez également créer un nouveau lieu.')}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <VenueSelector
                        venues={venues}
                        selectedVenueId={data.venue_id || ''}
                        onVenueChange={handleVenueChange}
                        onVenuesUpdate={onVenuesUpdate}
                        onError={onError}
                        onSuccess={onSuccess}
                        required
                    />
                </Grid>

                {/* Show selected venue details if available */}
                {data.venue_id && venues.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        {(() => {
                            const selectedVenue = venues.find(v => v.id === data.venue_id);
                            if (!selectedVenue) return null;

                            return (
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mt: 2
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom>
                                        {t('Lieu sélectionné')}
                                    </Typography>

                                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {selectedVenue.name}
                                    </Typography>

                                    {selectedVenue.address && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            📍 {selectedVenue.address}
                                            {selectedVenue.city && `, ${selectedVenue.city}`}
                                            {selectedVenue.postal_code && ` ${selectedVenue.postal_code}`}
                                        </Typography>
                                    )}

                                    {selectedVenue.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedVenue.description}
                                        </Typography>
                                    )}

                                    {selectedVenue.capacity && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            👥 {t('Capacité:')} {selectedVenue.capacity} {t('personnes')}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })()}
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default VenueStep;
