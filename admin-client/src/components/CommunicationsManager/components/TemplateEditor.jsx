import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Grid,
    MenuItem,
} from "@mui/material";

const availableLanguages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
];

const TemplateEditor = ({ open, onClose, template, onSave }) => {
    const [formData, setFormData] = React.useState({
        name: "",
        language: "fr",
        subject: "",
        body: "",
        description: "",
        is_active: true,
    });

    React.useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || "",
                language: template.language || "fr",
                subject: template.subject || "",
                body: template.body || "",
                description: template.description || "",
                is_active: template.is_active !== false,
            });
        } else {
            setFormData({
                name: "",
                language: "fr",
                subject: "",
                body: "",
                description: "",
                is_active: true,
            });
        }
    }, [template, open]);

    const handleSave = async () => {
        try {
            await onSave(formData, !!template, template?.id);
            onClose();
        } catch (error) {
            console.error("Error saving template:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {template ? "Modifier le template" : "Créer un nouveau template"}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Langue"
                                value={formData.language}
                                onChange={(e) => setFormData({...formData, language: e.target.value})}
                            >
                                {availableLanguages.map((lang) => (
                                    <MenuItem key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Sujet"
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Corps du message"
                                value={formData.body}
                                onChange={(e) => setFormData({...formData, body: e.target.value})}
                                multiline
                                rows={8}
                                required
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained">
                    {template ? "Modifier" : "Créer"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TemplateEditor;
