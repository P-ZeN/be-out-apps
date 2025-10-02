import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    Preview as PreviewIcon
} from '@mui/icons-material';

const TestPushDialog = ({
    open,
    onClose,
    template,
    onTest,
    selectedLanguage
}) => {
    const [testData, setTestData] = useState({});
    const [selectedTestLanguage, setSelectedTestLanguage] = useState(selectedLanguage);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(null);

    const languages = [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' }
    ];

    // Sample test data based on template type
    const getSampleData = (templateType) => {
        const baseData = {
            userName: 'Jean Dupont',
            appName: 'Be Out'
        };

        switch (templateType) {
            case 'event_reminder':
                return {
                    ...baseData,
                    eventName: 'Concert Jazz au Parc',
                    eventDate: '15/12/2024',
                    eventTime: '20h30',
                    eventLocation: 'Parc de la Villette, Paris'
                };
            case 'booking_confirmation':
                return {
                    ...baseData,
                    eventName: 'Concert Jazz au Parc',
                    bookingDate: '10/12/2024',
                    eventDate: '15/12/2024',
                    organizerName: 'Jazz Association Paris'
                };
            case 'booking_cancellation':
                return {
                    ...baseData,
                    eventName: 'Concert Jazz au Parc',
                    eventDate: '15/12/2024',
                    refundInfo: 'Remboursement intégral sous 5-7 jours'
                };
            case 'event_update':
                return {
                    ...baseData,
                    eventName: 'Concert Jazz au Parc',
                    updateType: 'Changement de lieu',
                    eventDate: '15/12/2024'
                };
            default:
                return baseData;
        }
    };

    useEffect(() => {
        if (template && open) {
            const sampleData = getSampleData(template.type);
            setTestData(sampleData);
            setSelectedTestLanguage(selectedLanguage);
            setResult(null);
            generatePreview(sampleData, selectedLanguage);
        }
    }, [template, open, selectedLanguage]);

    const handleTestDataChange = (key, value) => {
        const newTestData = {
            ...testData,
            [key]: value
        };
        setTestData(newTestData);
        generatePreview(newTestData, selectedTestLanguage);
    };

    const generatePreview = (data, lang) => {
        if (!template) return;

        const replaceVariables = (text, variables) => {
            if (!text) return '';
            let result = text;
            Object.entries(variables).forEach(([key, value]) => {
                const variable = `{{${key}}}`;
                result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
            });
            return result;
        };

        const title = replaceVariables(template.title?.[lang] || template.title?.fr || '', data);
        const body = replaceVariables(template.body?.[lang] || template.body?.fr || '', data);

        setPreview({
            title,
            body,
            icon: template.icon,
            badge: template.badge,
            image: template.image
        });
    };

    const handleTest = async () => {
        if (!template) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await onTest(template.key, {
                ...testData,
                language: selectedTestLanguage
            });

            setResult({
                success: true,
                message: 'Notification de test envoyée avec succès !',
                details: response
            });
        } catch (error) {
            setResult({
                success: false,
                message: 'Erreur lors de l\'envoi de la notification de test',
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLang) => {
        setSelectedTestLanguage(newLang);
        generatePreview(testData, newLang);
    };

    if (!template) return null;

    const templateVariables = Object.keys(testData);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: '60vh' } }}
        >
            <DialogTitle>
                Tester la notification: {template.name}
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Left Column - Test Configuration */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Configuration du test
                        </Typography>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Langue de test</InputLabel>
                            <Select
                                value={selectedTestLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                            >
                                {languages.map((lang) => (
                                    <MenuItem key={lang.code} value={lang.code}>
                                        {lang.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                            Données de test
                        </Typography>

                        {templateVariables.map((variable) => (
                            <TextField
                                key={variable}
                                fullWidth
                                label={variable}
                                value={testData[variable] || ''}
                                onChange={(e) => handleTestDataChange(variable, e.target.value)}
                                margin="normal"
                                size="small"
                            />
                        ))}

                        <Box mt={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                                onClick={handleTest}
                                disabled={loading}
                            >
                                {loading ? 'Envoi en cours...' : 'Envoyer notification de test'}
                            </Button>
                        </Box>

                        {result && (
                            <Alert
                                severity={result.success ? 'success' : 'error'}
                                sx={{ mt: 2 }}
                            >
                                <Typography variant="body2">
                                    {result.message}
                                </Typography>
                                {result.error && (
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        Détails: {result.error}
                                    </Typography>
                                )}
                            </Alert>
                        )}
                    </Grid>

                    {/* Right Column - Preview */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Aperçu de la notification
                        </Typography>

                        {preview ? (
                            <Paper elevation={3} sx={{ p: 3, bgcolor: 'grey.50' }}>
                                {/* Mobile notification mockup */}
                                <Box
                                    sx={{
                                        border: '2px solid #ddd',
                                        borderRadius: 2,
                                        p: 2,
                                        bgcolor: 'white',
                                        maxWidth: 300,
                                        mx: 'auto'
                                    }}
                                >
                                    <Box display="flex" alignItems="start" gap={2}>
                                        {preview.icon && (
                                            <Box
                                                component="img"
                                                src={preview.icon}
                                                alt="Icône"
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    mt: 0.5,
                                                    borderRadius: 1
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <Box flex={1}>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight="bold"
                                                sx={{ lineHeight: 1.2 }}
                                            >
                                                {preview.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.5, lineHeight: 1.3 }}
                                            >
                                                {preview.body}
                                            </Typography>
                                        </Box>
                                        {preview.badge && (
                                            <Box
                                                component="img"
                                                src={preview.badge}
                                                alt="Badge"
                                                sx={{ width: 16, height: 16 }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {preview.image && (
                                        <Box mt={2}>
                                            <Box
                                                component="img"
                                                src={preview.image}
                                                alt="Image de la notification"
                                                sx={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: 1,
                                                    maxHeight: 120,
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', textAlign: 'center', mt: 2 }}
                                >
                                    Aperçu sur mobile
                                </Typography>
                            </Paper>
                        ) : (
                            <Alert severity="info">
                                Remplissez les données de test pour voir l'aperçu
                            </Alert>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" gutterBottom>
                            Informations du template
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Type:</strong> {template.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Clé:</strong> {template.key}
                        </Typography>
                        {template.description && (
                            <Typography variant="body2" color="text.secondary">
                                <strong>Description:</strong> {template.description}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} startIcon={<CloseIcon />}>
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TestPushDialog;
