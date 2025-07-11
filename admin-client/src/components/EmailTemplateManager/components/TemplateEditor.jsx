import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Grid,
    MenuItem,
} from "@mui/material";
import EmailEditor from "./EmailEditor";
import QuickVariables from "./QuickVariables";
import TemplateGallery from "./TemplateGallery";
import { availableLanguages } from "../constants";

const TemplateEditor = ({ open, onClose, template, selectedLanguage, templates = [], onSave }) => {
    const [formData, setFormData] = useState({
        name: "",
        language: "fr",
        subject: "",
        body: "",
        description: "",
        variables: "{}",
        is_active: true,
    });

    const isEditing = !!template;

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                language: template.language,
                subject: template.subject,
                body: template.body,
                description: template.description || "",
                variables:
                    typeof template.variables === "string"
                        ? template.variables
                        : JSON.stringify(template.variables || {}, null, 2),
                is_active: template.is_active,
            });
        } else {
            setFormData({
                name: "",
                language: selectedLanguage,
                subject: "",
                body: "",
                description: "",
                variables: "{}",
                is_active: true,
            });
        }
    }, [template, selectedLanguage, open]);

    const handleSave = async () => {
        try {
            let variables = {};
            try {
                variables = JSON.parse(formData.variables);
            } catch (error) {
                throw new Error("JSON invalide dans le champ variables");
            }

            const payload = {
                ...formData,
                variables,
            };

            await onSave(payload, isEditing, template?.id);
            onClose();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleVariableInsert = (variable) => {
        setFormData((prev) => ({
            ...prev,
            body: prev.body + " " + variable.value,
        }));
    };

    const handleTemplateLoad = (templateHtml) => {
        setFormData((prev) => ({
            ...prev,
            body: templateHtml,
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            disableRestoreFocus
            disableEnforceFocus
            keepMounted={false}>
            <DialogTitle>{isEditing ? "Modifier Template" : "Créer Template"}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Nom du Template"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                label="Langue"
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                required>
                                {availableLanguages.map((lang) => (
                                    <MenuItem key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                }
                                label="Actif"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Sujet"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Corps de l'Email
                            </Typography>
                            <EmailEditor
                                value={formData.body}
                                onChange={(value) => setFormData({ ...formData, body: value })}
                                height="450px"
                                showWysiwyg={true}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                💡 Utilisez le mode visuel pour un formatage facile, ou basculez vers le code HTML pour
                                une édition avancée. Les variables comme {"{"}
                                {"{"} userName {"}"}
                                {"}"} seront remplacées lors de l'envoi des emails.
                            </Typography>

                            <QuickVariables onVariableInsert={handleVariableInsert} />
                            <TemplateGallery templates={templates} onTemplateLoad={handleTemplateLoad} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Variables (JSON)
                            </Typography>
                            <TextField
                                multiline
                                rows={6}
                                fullWidth
                                value={formData.variables}
                                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                                variant="outlined"
                                placeholder='{"userName": "John Doe", "email": "john@example.com"}'
                                sx={{
                                    "& .MuiInputBase-root": {
                                        fontFamily: "monospace",
                                        fontSize: "14px",
                                    },
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                Définissez les variables par défaut au format JSON. Elles seront utilisées pour les
                                tests de template et comme valeurs de fallback.
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained">
                    {isEditing ? "Mettre à jour" : "Créer"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

TemplateEditor.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    template: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        language: PropTypes.string,
        subject: PropTypes.string,
        body: PropTypes.string,
        variables: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // Can be string (JSON) or object
        status: PropTypes.string,
    }),
    selectedLanguage: PropTypes.string.isRequired,
    templates: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            body: PropTypes.string.isRequired,
            status: PropTypes.string, // Not required - may be undefined
        })
    ),
    onSave: PropTypes.func.isRequired,
};

export default TemplateEditor;
