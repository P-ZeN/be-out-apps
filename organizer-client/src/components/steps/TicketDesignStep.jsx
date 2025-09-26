import React, { useState } from "react";
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
    Avatar,
    Paper,
    RadioGroup,
    Radio,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    CloudUpload as CloudUploadIcon,
    Image as ImageIcon,
    QrCode as QrCodeIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";
import SavePresetDialog from "../dialogs/SavePresetDialog";
import organizerService from "../../services/organizerService";

const TicketDesignStep = ({ data, onChange, templates, eventData }) => {
    const { t } = useTranslation('organizer');
    const [backgroundImageFile, setBackgroundImageFile] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
    const [presets, setPresets] = useState([]);
    const [isLoadingPresets, setIsLoadingPresets] = useState(true);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [presetToDelete, setPresetToDelete] = useState(null);

    // Ticket size options (for future use - currently fixed to A5)
    const ticketSizes = [
        { value: 'A4', label: t('A4', { ns: 'ticketDesign' }) },
        { value: 'A5', label: t('A5', { ns: 'ticketDesign' }) }
    ];

    // QR Code content options
    const qrCodeOptions = [
        {
            value: 'booking_reference',
            label: t('organizer:tickets.design.qr.options.bookingReference'),
            description: t('organizer:tickets.design.qr.descriptions.bookingReference')
        },
        {
            value: 'verification_url',
            label: t('organizer:tickets.design.qr.options.verificationUrl'),
            description: t('organizer:tickets.design.qr.descriptions.verificationUrl')
        },
        {
            value: 'event_details',
            label: t('organizer:tickets.design.qr.options.eventDetails'),
            description: t('organizer:tickets.design.qr.descriptions.eventDetails')
        }
    ];

    // Color preset options
    const colorPresets = [
        { name: t('organizer:tickets.design.colors.blue'), value: '#1976d2' },
        { name: t('organizer:tickets.design.colors.green'), value: '#388e3c' },
        { name: t('organizer:tickets.design.colors.orange'), value: '#f57c00' },
        { name: t('organizer:tickets.design.colors.purple'), value: '#7b1fa2' },
        { name: t('organizer:tickets.design.colors.red'), value: '#d32f2f' },
        { name: t('organizer:tickets.design.colors.teal'), value: '#00796b' }
    ];

        // Initialize customizations with A5 as default
    React.useEffect(() => {
        if (!data.customizations?.ticket_size) {
            onChange({
                ...data,
                customizations: {
                    ...data.customizations,
                    ticket_size: 'A5'  // Set A5 as default
                }
            });
        }
    }, []);

    // Load presets on component mount
    React.useEffect(() => {
        loadPresets();
    }, []);

    const loadPresets = async () => {
        try {
            setIsLoadingPresets(true);
            const presetData = await organizerService.getTicketTemplates();
            setPresets(presetData);
        } catch (error) {
            console.error('Error loading presets:', error);
            // Could add a toast notification here
        } finally {
            setIsLoadingPresets(false);
        }
    };

    // Handle changes to form data - follow the same pattern as other steps
    const handleChange = (field, value) => {
        console.log('handleChange:', field, 'value:', value);
        const newData = {
            ...data,
            [field]: value,
        };
        console.log('Calling onChange with:', newData);
        onChange(newData);
    };

    const handleCustomizationChange = (field, value) => {
        const updatedCustomizations = {
            ...data.customizations,
            [field]: value
        };
        console.log('handleCustomizationChange:', field, value, 'resulting in:', updatedCustomizations);
        handleChange('customizations', updatedCustomizations);
    };

    const handleBookingSettingsChange = (field, value) => {
        const updatedBookingSettings = {
            ...data.booking_settings,
            [field]: value
        };
        handleChange('booking_settings', updatedBookingSettings);
    };

    const handleApplyPreset = (presetId) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset && preset.template_data) {
            console.log('Applying preset:', preset.name, 'with full template_data:', preset.template_data);

            // Handle both new format (with customizations/booking_settings) and old format (direct customizations)
            let updatedData = { ...data };

            if (preset.template_data.customizations) {
                // New format: separate customizations and booking_settings
                updatedData.customizations = {
                    ...data.customizations,
                    ...preset.template_data.customizations
                };

                if (preset.template_data.booking_settings) {
                    updatedData.booking_settings = {
                        ...data.booking_settings,
                        ...preset.template_data.booking_settings
                    };
                }
            } else {
                // Old format: template_data contains customizations directly
                updatedData.customizations = {
                    ...data.customizations,
                    ...preset.template_data
                };
            }

            console.log('Updated data after applying preset:', updatedData);
            onChange(updatedData);

            // Could add a success toast notification here
        } else {
            console.log('No preset found or no template_data for preset ID:', presetId);
            console.log('Available presets:', presets);
        }
    };

    const handleDeletePreset = (presetId, presetName) => {
        setPresetToDelete({ id: presetId, name: presetName });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!presetToDelete) return;

        try {
            await organizerService.deleteTicketTemplate(presetToDelete.id);

            // Remove the preset from the list
            setPresets(prev => prev.filter(p => p.id !== presetToDelete.id));

            console.log('Preset deleted successfully:', presetToDelete.name);
            // Could add a success toast notification here
        } catch (error) {
            console.error('Error deleting preset:', error);
            // Could add an error toast notification here
        } finally {
            setDeleteConfirmOpen(false);
            setPresetToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setPresetToDelete(null);
    };

    const handleSavePreset = () => {
        setSavePresetDialogOpen(true);
    };

    const handleSavePresetConfirm = async (presetData) => {
        try {
            const templateData = {
                name: presetData.name,
                description: presetData.description,
                template_data: {
                    customizations: data.customizations,
                    booking_settings: data.booking_settings
                }
            };

            const newPreset = await organizerService.createTicketTemplate(templateData);

            // Add the new preset to the list
            setPresets(prev => [newPreset, ...prev]);

            // Close the dialog
            setSavePresetDialogOpen(false);

            console.log('Preset saved successfully:', newPreset.name);
            // Could add a success toast notification here
        } catch (error) {
            console.error('Error saving preset:', error);
            // Could add an error toast notification here
        }
    };

    const handleBackgroundImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setBackgroundImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                handleCustomizationChange('background_image', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeBackgroundImage = () => {
        setBackgroundImageFile(null);
        handleCustomizationChange('background_image', '');
    };

    const addPricingTier = () => {
        const newTier = {
            id: Date.now(),
            name: '',
            price: '',
            description: '',
            quantity: '',
            early_bird_price: '',
            early_bird_deadline: null,
            is_early_bird: false
        };
        const updatedTiers = [...(data.pricing_tiers || []), newTier];
        handleChange('pricing_tiers', updatedTiers);
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
                {t('organizer:tickets.design.title')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('organizer:tickets.design.description')}
            </Typography>

            {/* Preset Management Hero Section */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    {t('organizer:tickets.design.presets.title', 'Design Presets')}
                </Typography>

                {/* Apply Preset Section */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('organizer:tickets.design.presets.applyDescription', 'Select a preset to apply to this ticket.')}
                </Typography>

                {isLoadingPresets ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('organizer:tickets.design.presets.loading', 'Loading presets...')}
                        </Typography>
                    </Box>
                ) : presets.length === 0 ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {t('organizer:tickets.design.presets.noPresetsYet', 'No presets yet')}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('organizer:tickets.design.presets.availablePresets', 'Available Presets:')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {presets.map((preset) => (
                                <Card key={preset.id} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {preset.name}
                                            </Typography>
                                            {preset.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {preset.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleApplyPreset(preset.id)}
                                            >
                                                {t('organizer:tickets.design.presets.apply', 'Apply')}
                                            </Button>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeletePreset(preset.id, preset.name)}
                                                title={t('organizer:tickets.design.presets.delete', 'Delete preset')}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Save Preset Section */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('organizer:tickets.design.presets.saveDescription', 'Save your current design as a preset to quickly apply it to future events.')}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={handleSavePreset}
                        startIcon={<AddIcon />}
                        sx={{ minWidth: 140 }}
                    >
                        {t('organizer:tickets.design.presets.save', 'Save as Preset')}
                    </Button>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                {/* Images Section */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('organizer:tickets.design.images.title')}
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Use Event Image Switch */}
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.customizations?.use_event_image ?? true}
                                        onChange={(e) => handleCustomizationChange('use_event_image', e.target.checked)}
                                    />
                                }
                                label={t('organizer:tickets.design.images.useEventImage')}
                            />
                        </Grid>

                        {/* Background Image Upload */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {t('organizer:tickets.design.backgroundImage')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{ minWidth: 150 }}
                                >
                                    {t('organizer:tickets.design.chooseImage')}
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleBackgroundImageUpload}
                                    />
                                </Button>
                                {data.customizations?.background_image && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={removeBackgroundImage}
                                    >
                                        {t('organizer:tickets.design.removeImage')}
                                    </Button>
                                )}
                            </Box>
                            {data.customizations?.background_image && (
                                <Box sx={{ mt: 2 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            display: 'inline-block',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                src={data.customizations.background_image}
                                                variant="square"
                                                sx={{ width: 60, height: 60 }}
                                            >
                                                <ImageIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {backgroundImageFile?.name || t('organizer:tickets.design.backgroundImageSelected')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('organizer:tickets.design.backgroundImageNote')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Grid>

                {/* QR Code Configuration */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <QrCodeIcon color="action" />
                        <Typography variant="h6">
                            {t('organizer:tickets.design.qr.title')}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('organizer:tickets.design.qr.description')}
                    </Typography>

                    <Grid container spacing={2}>

                                <Grid size={{ xs: 12 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>{t('organizer:tickets.design.qr.contentType')}</InputLabel>
                                        <Select
                                            value={data.customizations?.qr_code_type || 'booking_reference'}
                                            onChange={(e) => handleCustomizationChange('qr_code_type', e.target.value)}
                                            label={t('organizer:tickets.design.qr.contentType')}
                                        >
                                            {qrCodeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {option.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {option.description}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* QR Type-specific Configuration */}
                                {data.customizations?.qr_code_type === 'verification_url' && (
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label={t('organizer:tickets.design.qr.verificationUrl')}
                                            value={data.customizations?.qr_verification_url || ''}
                                            onChange={(e) => handleCustomizationChange('qr_verification_url', e.target.value)}
                                            placeholder="https://mon-site.com/verify/{booking_reference}"
                                            helperText={t('organizer:tickets.design.qr.verificationUrlHelp')}
                                        />
                                    </Grid>
                                )}

                                {(data.customizations?.qr_code_type || 'booking_reference') === 'booking_reference' && (
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label={t('organizer:tickets.design.qr.bookingReferenceFormat')}
                                            value={data.customizations?.qr_booking_format || '{ticket_number}'}
                                            onChange={(e) => handleCustomizationChange('qr_booking_format', e.target.value)}
                                            placeholder="{ticket_number}"
                                            helperText={t('organizer:tickets.design.qr.bookingReferenceFormatHelp')}
                                        />
                                    </Grid>
                                )}

                                {data.customizations?.qr_code_type === 'event_details' && (
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label={t('organizer:tickets.design.qr.eventDetailsJson')}
                                            value={data.customizations?.qr_event_details || ''}
                                            onChange={(e) => handleCustomizationChange('qr_event_details', e.target.value)}
                                            placeholder='{"event": "{event_title}", "date": "{event_date}", "venue": "{venue_name}", "ticket": "{ticket_number}"}'
                                            helperText={t('organizer:tickets.design.qr.eventDetailsJsonHelp')}
                                        />
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            <strong>{t('organizer:tickets.design.qr.placeholdersTitle')}</strong><br />
                                            • <code>{'{ticket_number}'}</code> - {t('organizer:tickets.design.qr.placeholderTicketNumber')}<br />
                                            • <code>{'{booking_reference}'}</code> - {t('organizer:tickets.design.qr.placeholderBooking')}<br />
                                            • <code>{'{booking_id}'}</code> - {t('organizer:tickets.design.qr.placeholderBookingId')}<br />
                                            • <code>{'{event_title}'}</code> - {t('organizer:tickets.design.qr.placeholderTitle')}<br />
                                            • <code>{'{event_date}'}</code> - {t('organizer:tickets.design.qr.placeholderDate')}<br />
                                            • <code>{'{venue_name}'}</code> - {t('organizer:tickets.design.qr.placeholderVenue')}<br />
                                            • <code>{'{pricing_category}'}</code> - Pricing category name<br />
                                            • <code>{'{pricing_tier}'}</code> - Pricing tier name<br />
                                            • <code>{'{tier_price}'}</code> - Ticket price for this tier
                                        </Typography>
                                    </Alert>
                                </Grid>
                    </Grid>
                </Grid>

                {/* Design Customizations */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {t('organizer:tickets.design.customization')}
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {/* Primary Color */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label={t('organizer:tickets.design.primaryColor')}
                                type="color"
                                value={data.customizations?.primary_color || '#1976d2'}
                                onChange={(e) => handleCustomizationChange('primary_color', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: data.customizations?.primary_color || '#1976d2',
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(0,0,0,0.12)'
                                                }}
                                            />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        {/* Secondary Color */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label={t('organizer:tickets.design.secondaryColor')}
                                type="color"
                                value={data.customizations?.secondary_color || '#9c27b0'}
                                onChange={(e) => handleCustomizationChange('secondary_color', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: data.customizations?.secondary_color || '#9c27b0',
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(0,0,0,0.12)'
                                                }}
                                            />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        {/* Custom Text */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label={t('organizer:tickets.design.customText')}
                                value={data.customizations?.custom_text || ''}
                                onChange={(e) => handleCustomizationChange('custom_text', e.target.value)}
                                multiline
                                rows={2}
                                placeholder={t('organizer:tickets.design.customTextPlaceholder')}
                                helperText={t('organizer:tickets.design.customTextHelp')}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Pricing Tiers */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {t('organizer:tickets.pricing.title')}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addPricingTier}
                        >
                            {t('organizer:tickets.pricing.addTier')}
                        </Button>
                    </Box>

                    {(!data.pricing_tiers || data.pricing_tiers.length === 0) && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {t('organizer:tickets.pricing.noTiers')}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {(data.pricing_tiers || []).map((tier, index) => (
                            <Grid size={{ xs: 12 }} key={tier.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                                {t('organizer:tickets.pricing.tier')} {index + 1}
                                            </Typography>
                                            <IconButton
                                                color="error"
                                                onClick={() => removePricingTier(tier.id)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label={t('organizer:tickets.pricing.tierName')}
                                                    value={tier.name || ''}
                                                    onChange={(e) => updatePricingTier(tier.id, 'name', e.target.value)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label={t('organizer:tickets.pricing.price')}
                                                    type="number"
                                                    value={tier.price || ''}
                                                    onChange={(e) => updatePricingTier(tier.id, 'price', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                                    }}
                                                    required
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label={t('organizer:tickets.pricing.description')}
                                                    value={tier.description || ''}
                                                    onChange={(e) => updatePricingTier(tier.id, 'description', e.target.value)}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label={t('organizer:tickets.pricing.quantity')}
                                                    type="number"
                                                    value={tier.quantity || ''}
                                                    onChange={(e) => updatePricingTier(tier.id, 'quantity', e.target.value)}
                                                    helperText={t('organizer:tickets.pricing.quantityHelp')}
                                                />
                                            </Grid>

                                            {/* Early Bird Settings */}
                                            <Grid size={{ xs: 12 }}>
                                                <Divider sx={{ my: 2 }} />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={tier.is_early_bird || false}
                                                            onChange={(e) => updatePricingTier(tier.id, 'is_early_bird', e.target.checked)}
                                                        />
                                                    }
                                                    label={t('organizer:tickets.pricing.earlyBird')}
                                                />
                                            </Grid>

                                            {tier.is_early_bird && (
                                                <>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            label={t('organizer:tickets.pricing.earlyBirdPrice')}
                                                            type="number"
                                                            value={tier.early_bird_price || ''}
                                                            onChange={(e) => updatePricingTier(tier.id, 'early_bird_price', e.target.value)}
                                                            InputProps={{
                                                                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <DateTimePicker
                                                            label={t('organizer:tickets.pricing.earlyBirdDeadline')}
                                                            value={tier.early_bird_deadline}
                                                            onChange={(value) => updatePricingTier(tier.id, 'early_bird_deadline', value)}
                                                            slotProps={{
                                                                textField: {
                                                                    fullWidth: true,
                                                                }
                                                            }}
                                                        />
                                                    </Grid>
                                                </>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Booking Settings */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('organizer:tickets.booking.settings')}
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.booking_settings?.allow_multiple_bookings !== false}
                                        onChange={(e) => handleBookingSettingsChange('allow_multiple_bookings', e.target.checked)}
                                    />
                                }
                                label={t('organizer:tickets.booking.allowMultiple')}
                            />
                        </Grid>
                    </Grid>
                </Grid>


            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-preset-dialog-title"
                aria-describedby="delete-preset-dialog-description"
            >
                <DialogTitle id="delete-preset-dialog-title">
                    {t('organizer:tickets.design.presets.deleteTitle', 'Delete Preset')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-preset-dialog-description">
                        {t('organizer:tickets.design.presets.deleteMessage', 'Are you sure you want to delete the preset "{presetName}"? This action cannot be undone.', { presetName: presetToDelete?.name })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        {t('organizer:tickets.design.presets.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        {t('organizer:tickets.design.presets.deleteConfirm', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Save Preset Dialog */}
            <SavePresetDialog
                open={savePresetDialogOpen}
                onClose={() => setSavePresetDialogOpen(false)}
                onSave={handleSavePresetConfirm}
                currentCustomizations={data.customizations || {}}
            />
        </Box>
    );
};

export default TicketDesignStep;
