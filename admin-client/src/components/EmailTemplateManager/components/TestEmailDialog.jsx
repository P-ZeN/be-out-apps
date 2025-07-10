import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
} from "@mui/material";
import { Send } from "@mui/icons-material";

const TestEmailDialog = ({ open, onClose, template, onSendTest }) => {
    const [testEmail, setTestEmail] = useState("");
    const [testVariables, setTestVariables] = useState("{}");

    const handleSendTest = async () => {
        try {
            let variables = {};
            try {
                variables = JSON.parse(testVariables);
            } catch (error) {
                throw new Error("JSON invalide dans les variables de test");
            }

            await onSendTest(template.id, testEmail, variables);
            onClose();
            setTestEmail("");
            setTestVariables("{}");
        } catch (error) {
            alert(error.message);
        }
    };

    const handleClose = () => {
        onClose();
        setTestEmail("");
        setTestVariables("{}");
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
            fullWidth
            disableRestoreFocus
            disableEnforceFocus
            keepMounted={false}
        >
            <DialogTitle>Tester Template Email</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Adresse Email de Test"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        type="email"
                        required
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="subtitle2" gutterBottom>
                        Variables de Test (JSON)
                    </Typography>
                    <TextField
                        multiline
                        rows={8}
                        fullWidth
                        value={testVariables}
                        onChange={(e) => setTestVariables(e.target.value)}
                        variant="outlined"
                        placeholder='{"userName": "Test User", "email": "test@example.com"}'
                        sx={{
                            "& .MuiInputBase-root": {
                                fontFamily: "monospace",
                                fontSize: "14px",
                            },
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Fournissez des données de test au format JSON pour prévisualiser comment les variables
                        seront remplacées dans l'email.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Annuler</Button>
                <Button onClick={handleSendTest} variant="contained" startIcon={<Send />}>
                    Envoyer Email de Test
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TestEmailDialog;
