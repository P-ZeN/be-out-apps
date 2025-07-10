import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import EmailTemplateManager from "../components/EmailTemplateManager";

const AdminEmails = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Email Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Manage email templates, view delivery logs, and configure email settings.
            </Typography>

            <Paper elevation={1} sx={{ p: 0, borderRadius: 2 }}>
                <EmailTemplateManager />
            </Paper>
        </Box>
    );
};

export default AdminEmails;
