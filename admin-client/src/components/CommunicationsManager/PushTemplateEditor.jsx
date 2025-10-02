import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Tabs,
    Tab,
    Alert,
    Chip,
    Grid,
    Paper,
    Divider
} from '@mui/material';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Preview as PreviewIcon
} from '@mui/icons-material';

const PushTemplateEditor = ({
    open,
    onClose,
    template,
    onSave,
    selectedLanguage
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'general',
        key: '',
        title: { fr: '', en: '', es: '' },
        body: { fr: '', en: '', es: '' },
        icon: '',
        badge: '',
        image: '',
        actions: []
    });
    const [currentLangTab, setCurrentLangTab] = useState(0);
    const [errors, setErrors] = useState({});
    const [preview, setPreview] = useState(null);

    const languages = [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' }
    ];

    const templateTypes = [
        { value: 'event_reminder', label: 'Rappel d\'événement' },
        { value: 'booking_confirmation', label: 'Confirmation de réservation' },
        { value: 'booking_cancellation', label: 'Annulation de réservation' },
        { value: 'event_update', label: 'Mise à jour d\'événement' },
        { value: 'general', label: 'Notification générale' }
    ];

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                description: template.description || '',
                type: template.type || 'general',
                key: template.key || '',
                title: template.title || { fr: '', en: '', es: '' },
                body: template.body || { fr: '', en: '', es: '' },
                icon: template.icon || '',
                badge: template.badge || '',
                image: template.image || '',
                actions: template.actions || []
            });
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'general',
                key: '',
                title: { fr: '', en: '', es: '' },
                body: { fr: '', en: '', es: '' },
                icon: '',
                badge: '',
                image: '',
                actions: []
            });
        }
        setErrors({});
        setCurrentLangTab(0);
    }, [template, open]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear errors for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleLanguageContentChange = (field, language, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [language]: value
            }
        }));
    };

    const generateKey = () => {
        if (formData.name && formData.type) {
            const key = `${formData.type}_${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            handleInputChange('key', key);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.key.trim()) {
            newErrors.key = 'La clé est requise';
        }

        if (!formData.type) {
            newErrors.type = 'Le type est requis';
        }

        // Validate that at least French content is provided
        if (!formData.title.fr.trim()) {
            newErrors.title_fr = 'Le titre en français est requis';
        }

        if (!formData.body.fr.trim()) {
            newErrors.body_fr = 'Le message en français est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            const isEditing = !!template;
            onSave(formData, isEditing);
        }
    };

    const generatePreview = () => {
        const lang = languages[currentLangTab].code;
        setPreview({
            title: formData.title[lang] || 'Titre de la notification',
            body: formData.body[lang] || 'Corps de la notification',
            icon: formData.icon || '/icons/notification-icon.png',
            badge: formData.badge || '/icons/badge.png'
        });
    };

    const availableVariables = {
        event_reminder: ['{{eventName}}', '{{eventDate}}', '{{eventTime}}', '{{eventLocation}}', '{{userName}}'],
        booking_confirmation: ['{{eventName}}', '{{bookingDate}}', '{{eventDate}}', '{{userName}}', '{{organizerName}}'],
        booking_cancellation: ['{{eventName}}', '{{eventDate}}', '{{userName}}', '{{refundInfo}}'],
        event_update: ['{{eventName}}', '{{updateType}}', '{{eventDate}}', '{{userName}}'],
        general: ['{{userName}}', '{{appName}}']
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: '70vh' } }}
        >
            <DialogTitle>
                {template ? 'Modifier le template' : 'Créer un nouveau template'}
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Left Column - Template Info */}
                    <Grid item xs={12} md={6}>
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                Informations générales
                            </Typography>

                            <TextField
                                fullWidth
                                label="Nom du template"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                                margin="normal"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                margin="normal"
                                multiline
                                rows={2}
                            />

                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Type de template</InputLabel>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    error={!!errors.type}
                                >
                                    {templateTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box display="flex" gap={1} mt={2}>
                                <TextField
                                    fullWidth
                                    label="Clé unique"
                                    value={formData.key}
                                    onChange={(e) => handleInputChange('key', e.target.value)}
                                    error={!!errors.key}
                                    helperText={errors.key || 'Identifiant unique pour ce template'}
                                    required
                                />
                                <Button
                                    variant="outlined"
                                    onClick={generateKey}
                                    sx={{ minWidth: 'auto', px: 2 }}
                                >
                                    Auto
                                </Button>
                            </Box>
                        </Box>

                        {/* Visual Settings */}
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                Paramètres visuels
                            </Typography>

                            <TextField
                                fullWidth
                                label="Icône (URL)"
                                value={formData.icon}
                                onChange={(e) => handleInputChange('icon', e.target.value)}
                                margin="normal"
                                helperText="URL de l'icône à afficher (optionnel)"
                            />

                            <TextField
                                fullWidth
                                label="Badge (URL)"
                                value={formData.badge}
                                onChange={(e) => handleInputChange('badge', e.target.value)}
                                margin="normal"
                                helperText="URL du badge à afficher (optionnel)"
                            />

                            <TextField
                                fullWidth
                                label="Image (URL)"
                                value={formData.image}
                                onChange={(e) => handleInputChange('image', e.target.value)}
                                margin="normal"
                                helperText="URL d'une image à afficher (optionnel)"
                            />
                        </Box>
                    </Grid>

                    {/* Right Column - Content */}
                    <Grid item xs={12} md={6}>
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                Contenu des notifications
                            </Typography>

                            <Tabs
                                value={currentLangTab}
                                onChange={(e, newValue) => setCurrentLangTab(newValue)}
                                sx={{ mb: 2 }}
                            >
                                {languages.map((lang, index) => (
                                    <Tab key={lang.code} label={lang.label} />
                                ))}
                            </Tabs>

                            {languages.map((lang, index) => (
                                <Box key={lang.code} hidden={currentLangTab !== index}>
                                    <TextField
                                        fullWidth
                                        label={`Titre (${lang.label})`}
                                        value={formData.title[lang.code]}
                                        onChange={(e) => handleLanguageContentChange('title', lang.code, e.target.value)}
                                        margin="normal"
                                        required={lang.code === 'fr'}
                                        error={!!errors[`title_${lang.code}`]}
                                        helperText={errors[`title_${lang.code}`]}
                                    />

                                    <TextField
                                        fullWidth
                                        label={`Message (${lang.label})`}
                                        value={formData.body[lang.code]}
                                        onChange={(e) => handleLanguageContentChange('body', lang.code, e.target.value)}
                                        margin="normal"
                                        multiline
                                        rows={4}
                                        required={lang.code === 'fr'}
                                        error={!!errors[`body_${lang.code}`]}
                                        helperText={errors[`body_${lang.code}`]}
                                    />
                                </Box>
                            ))}
                        </Box>

                        {/* Variables Available */}
                        {availableVariables[formData.type] && (
                            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Variables disponibles:
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {availableVariables[formData.type].map((variable) => (
                                        <Chip
                                            key={variable}
                                            label={variable}
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                // Copy to clipboard
                                                navigator.clipboard.writeText(variable);
                                            }}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Cliquez sur une variable pour la copier
                                </Typography>
                            </Paper>
                        )}

                        {/* Preview */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Aperçu
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<PreviewIcon />}
                                    onClick={generatePreview}
                                >
                                    Générer l'aperçu
                                </Button>
                            </Box>

                            {preview ? (
                                <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Box display="flex" alignItems="start" gap={2}>
                                        {preview.icon && (
                                            <Box
                                                component="img"
                                                src={preview.icon}
                                                alt="Icône"
                                                sx={{ width: 24, height: 24, mt: 0.5 }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        )}
                                        <Box flex={1}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {preview.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {preview.body}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ) : (
                                <Alert severity="info">
                                    Cliquez sur "Générer l'aperçu" pour voir à quoi ressemblera la notification
                                </Alert>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} startIcon={<CloseIcon />}>
                    Annuler
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    startIcon={<SaveIcon />}
                >
                    {template ? 'Modifier' : 'Créer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PushTemplateEditor;
