import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { Construction } from "@mui/icons-material";

const EventForm = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Créer / Modifier un événement
            </Typography>

            <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                    <Construction sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Formulaire en cours de développement
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cette page sera bientôt disponible pour créer et modifier vos événements.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default EventForm;
