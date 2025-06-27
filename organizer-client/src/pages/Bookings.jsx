import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { BookOnline } from "@mui/icons-material";

const Bookings = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Réservations
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Gérez toutes les réservations de vos événements
            </Typography>

            <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                    <BookOnline sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Gestion des réservations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cette page affichera toutes les réservations avec possibilité de filtrage et d'export.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Bookings;
