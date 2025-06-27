import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

const Revenue = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Revenus et Paiements
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Suivez vos revenus, commissions et paiements
            </Typography>

            <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                    <TrendingUp sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Analyses financières
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cette page affichera vos revenus, les commissions platform, l'historique des paiements et les
                        analyses financières.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Revenue;
