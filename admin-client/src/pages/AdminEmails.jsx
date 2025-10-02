import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import CommunicationsManager from "../components/CommunicationsManager";

const AdminEmails = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Communications Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Gérez les modèles d'e-mails et de notifications push, affichez les journaux de livraison et configurez les paramètres de communication.
            </Typography>

            <Paper elevation={1} sx={{ p: 0, borderRadius: 2 }}>
                <CommunicationsManager />
            </Paper>
        </Box>
    );
};

export default AdminEmails;
