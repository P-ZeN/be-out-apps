import React from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Card,
    CardContent,
    Divider,
    Chip,
    Button,
    IconButton,
    Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const TicketDesignStep = ({ data, onChange, templates, eventData }) => {
    const { t } = useTranslation();

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const handleBookingSettingsChange = (field, value) => {
        handleChange('booking_settings', {
            ...data.booking_settings,
            [field]: value,
        });
    };

    const handleCustomizationChange = (field, value) => {
        handleChange('customizations', {
            ...data.customizations,
            [field]: value,
        });
    };

    const addPricingTier = () => {
        const newTier = {
            id: Date.now(),
            name: '',
            price: '',
            quantity: '',
            description: '',
        };
        
        handleChange('pricing_tiers', [...(data.pricing_tiers || []), newTier]);
    };

    const removePricingTier = (tierId) => {
        const updatedTiers = (data.pricing_tiers || []).filter(tier => tier.id !== tierId);
        handleChange('pricing_tiers', updatedTiers);
    };

    const updatePricingTier = (tierId, field, value) => {
        const updatedTiers = (data.pricing_tiers || []).map(tier => 
            tier.id === tierId ? { ...tier, [field]: value } : tier
        );
        handleChange('pricing_tiers', updatedTiers);
    };

    const selectedTemplate = templates.find(t => t.id === data.template_id);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {t('Design et billetterie')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('Configurez l\'apparence de vos billets et les options de réservation.')}
            </Typography>

            <Grid container spacing={3}>
                {/* Template Selection */}
                <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('Modèle de billet')}</InputLabel>
                        <Select
                            value={data.template_id || ''}
                            onChange={(e) => handleChange('template_id', e.target.value)}
                            label={t('Modèle de billet')}
                        >
                            <MenuItem value="">
                                <em>{t('Modèle par défaut')}</em>
                            </MenuItem>
                            {templates.map((template) => (
                                <MenuItem key={template.id} value={template.id}>
                                    {template.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Template Preview Info */}
                {selectedTemplate && (
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {selectedTemplate.name}
                                </Typography>
                                {selectedTemplate.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedTemplate.description}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Template Customizations */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('Personnalisation')}
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label={t('Couleur principale')}
                                type="color"
                                value={data.customizations?.primary_color || '#1976d2'}
                                onChange={(e) => handleCustomizationChange('primary_color', e.target.value)}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label={t('Couleur secondaire')}
                                type="color"
                                value={data.customizations?.secondary_color || '#f50057'}
                                onChange={(e) => handleCustomizationChange('secondary_color', e.target.value)}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label={t('Message personnalisé')}
                                value={data.customizations?.custom_message || ''}
                                onChange={(e) => handleCustomizationChange('custom_message', e.target.value)}
                                placeholder={t('Merci pour votre participation!')}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider />
                </Grid>

                {/* Pricing Tiers */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {t('Tarifs et catégories')}
                        </Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={addPricingTier}
                            variant="outlined"
                            size="small"
                        >
                            {t('Ajouter un tarif')}
                        </Button>
                    </Box>

                    {(!data.pricing_tiers || data.pricing_tiers.length === 0) && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {t('Aucun tarif spécifique défini. Le prix principal de l\'événement sera utilisé.')}
                        </Alert>
                    )}

                    {data.pricing_tiers && data.pricing_tiers.map((tier, index) => (
                        <Card key={tier.id} variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                        {t('Tarif')} {index + 1}
                                    </Typography>
                                    <IconButton
                                        onClick={() => removePricingTier(tier.id)}
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label={t('Nom du tarif')}
                                            value={tier.name || ''}
                                            onChange={(e) => updatePricingTier(tier.id, 'name', e.target.value)}
                                            placeholder={t('Ex: Tarif réduit, VIP, Étudiant')}
                                        />
                                    </Grid>
                                    
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label={t('Prix (€)')}
                                            value={tier.price || ''}
                                            onChange={(e) => updatePricingTier(tier.id, 'price', e.target.value)}
                                        />
                                    </Grid>
                                    
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label={t('Quantité')}
                                            value={tier.quantity || ''}
                                            onChange={(e) => updatePricingTier(tier.id, 'quantity', e.target.value)}
                                        />
                                    </Grid>
                                    
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label={t('Description')}
                                            value={tier.description || ''}
                                            onChange={(e) => updatePricingTier(tier.id, 'description', e.target.value)}
                                            placeholder={t('Décrivez ce qui est inclus dans ce tarif')}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider />
                </Grid>

                {/* Booking Settings */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('Paramètres de réservation')}
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DateTimePicker
                                label={t('Date limite de réservation')}
                                value={data.booking_settings?.booking_deadline}
                                onChange={(newValue) => handleBookingSettingsChange('booking_deadline', newValue)}
                                format="dd/MM/yyyy HH:mm"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        helperText: t('Laissez vide pour permettre les réservations jusqu\'au début de l\'événement'),
                                    },
                                }}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label={t('Maximum de réservations par utilisateur')}
                                value={data.booking_settings?.max_bookings_per_user || 1}
                                onChange={(e) => handleBookingSettingsChange('max_bookings_per_user', parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1, max: 10 }}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.booking_settings?.allow_multiple_bookings ?? true}
                                        onChange={(e) => handleBookingSettingsChange('allow_multiple_bookings', e.target.checked)}
                                    />
                                }
                                label={t('Autoriser plusieurs réservations par utilisateur')}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TicketDesignStep;
