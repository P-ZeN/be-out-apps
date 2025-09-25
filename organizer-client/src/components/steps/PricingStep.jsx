import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    Switch,
    FormControlLabel,
    Chip,
    Divider,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tabs,
    Tab,
    Paper,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Category as CategoryIcon,
    LocalOffer as PriceIcon,
    Schedule as ScheduleIcon,
    Group as GroupIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const PricingStep = ({ data, onChange }) => {
    const { t } = useTranslation('events');

    // Initialize pricing data structure
    // Note: 'data' IS the pricing data directly, not an object containing pricing
    const pricingData = data || {
        categories: [],
        settings: {
            currency: 'EUR',
            tax_included: true,
            refund_policy: 'flexible'
        }
    };

    // Start on Templates tab by default, but switch to Categories when data loads
    const [activeTab, setActiveTab] = useState(1);

    // Update tab when data changes - switch to Categories tab if we have data
    useEffect(() => {
        if (pricingData.categories.length > 0) {
            setActiveTab(0);
        }
    }, [pricingData.categories.length]);



    console.log('🎯 PricingStep final pricingData:', pricingData);

    // Track if we have existing data (migrated or manually entered)
    const hasExistingData = pricingData.categories.length > 0;

    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleChange = (field, value) => {
        // Since 'data' IS the pricing data, we update it directly
        const updatedPricing = {
            ...pricingData,
            [field]: value
        };
        console.log('🎯 PricingStep updating pricing data:', updatedPricing);
        onChange(updatedPricing);
    };

    // Category Management
    const addCategory = () => {
        const newCategory = {
            id: Date.now().toString(),
            name: '',
            description: '',
            tiers: [],
            display_order: pricingData.categories.length,
            is_active: true
        };

        const updatedCategories = [...pricingData.categories, newCategory];
        handleChange('categories', updatedCategories);
    };

    const updateCategory = (categoryId, field, value) => {
        const updatedCategories = pricingData.categories.map(category =>
            category.id === categoryId ? { ...category, [field]: value } : category
        );
        handleChange('categories', updatedCategories);
    };

    const removeCategory = (categoryId) => {
        const updatedCategories = pricingData.categories.filter(cat => cat.id !== categoryId);
        handleChange('categories', updatedCategories);
    };

    // Tier Management
    const addTier = (categoryId) => {
        const newTier = {
            id: Date.now().toString(),
            name: '',
            price: '',
            available_quantity: '',
            valid_from: null,
            valid_until: null,
            is_early_bird: false,
            display_order: 0
        };

        const updatedCategories = pricingData.categories.map(category =>
            category.id === categoryId
                ? { ...category, tiers: [...(category.tiers || []), newTier] }
                : category
        );
        handleChange('categories', updatedCategories);
    };

    const updateTier = (categoryId, tierId, field, value) => {
        const updatedCategories = pricingData.categories.map(category =>
            category.id === categoryId
                ? {
                    ...category,
                    tiers: category.tiers.map(tier => {
                        if (tier.id !== tierId) return tier;

                        // Create updated tier with the new field value
                        let updatedTier = { ...tier, [field]: value };

                        // Auto-calculate related fields based on what changed
                        if (field === 'originalPrice' || field === 'discountPercentage') {
                            // Calculate final price from original price and discount percentage
                            const originalPrice = parseFloat(field === 'originalPrice' ? value : tier.originalPrice || 0);
                            const discountPercentage = parseFloat(field === 'discountPercentage' ? value : tier.discountPercentage || 0);

                            if (originalPrice > 0 && discountPercentage >= 0) {
                                const calculatedPrice = (originalPrice * (1 - discountPercentage / 100)).toFixed(2);
                                updatedTier.price = calculatedPrice;
                            }
                        } else if (field === 'price' && tier.originalPrice) {
                            // Calculate discount percentage from original price and final price
                            const originalPrice = parseFloat(tier.originalPrice);
                            const finalPrice = parseFloat(value || 0);

                            if (originalPrice > 0 && finalPrice >= 0) {
                                const calculatedDiscount = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                                updatedTier.discountPercentage = Math.max(0, Math.min(100, calculatedDiscount));
                            }
                        }

                        return updatedTier;
                    })
                }
                : category
        );
        handleChange('categories', updatedCategories);
    };

    const removeTier = (categoryId, tierId) => {
        const updatedCategories = pricingData.categories.map(category =>
            category.id === categoryId
                ? { ...category, tiers: category.tiers.filter(tier => tier.id !== tierId) }
                : category
        );
        handleChange('categories', updatedCategories);
    };

    // Predefined pricing templates
    const pricingTemplates = [
        {
            name: t('events:pricing.templates.simple', 'Simple'),
            description: t('events:pricing.templates.simpleDesc', 'One category, one price'),
            categories: [
                {
                    id: 'simple-1',
                    name: t('events:pricing.templates.standardTicket', 'Standard Ticket'),
                    description: '',
                    tiers: [
                        {
                            id: 'tier-1',
                            name: t('events:pricing.templates.regularPrice', 'Regular Price'),
                            price: '25',
                            available_quantity: '',
                            is_early_bird: false
                        }
                    ]
                }
            ]
        },
        {
            name: t('events:pricing.templates.earlyBird', 'Early Bird'),
            description: t('events:pricing.templates.earlyBirdDesc', 'Early bird discount + regular pricing'),
            categories: [
                {
                    id: 'eb-1',
                    name: t('events:pricing.templates.standardTicket', 'Standard Ticket'),
                    description: '',
                    tiers: [
                        {
                            id: 'tier-eb-1',
                            name: t('events:pricing.templates.earlyBirdPrice', 'Early Bird'),
                            price: '20',
                            available_quantity: '50',
                            is_early_bird: true
                        },
                        {
                            id: 'tier-eb-2',
                            name: t('events:pricing.templates.regularPrice', 'Regular Price'),
                            price: '25',
                            available_quantity: '',
                            is_early_bird: false
                        }
                    ]
                }
            ]
        },
        {
            name: t('events:pricing.templates.tiered', 'Tiered'),
            description: t('events:pricing.templates.tieredDesc', 'Multiple categories (Standard, VIP, Student)'),
            categories: [
                {
                    id: 'tiered-1',
                    name: t('events:pricing.templates.standardCategory', 'Standard'),
                    description: t('events:pricing.templates.standardDesc', 'Regular access to the event'),
                    tiers: [
                        { id: 'tier-t-1', name: t('events:pricing.templates.regularPrice', 'Regular Price'), price: '25', available_quantity: '' }
                    ]
                },
                {
                    id: 'tiered-2',
                    name: t('events:pricing.templates.vipCategory', 'VIP'),
                    description: t('events:pricing.templates.vipDesc', 'Premium access with additional benefits'),
                    tiers: [
                        { id: 'tier-t-2', name: t('events:pricing.templates.vipPrice', 'VIP Price'), price: '50', available_quantity: '20' }
                    ]
                },
                {
                    id: 'tiered-3',
                    name: t('events:pricing.templates.studentCategory', 'Student'),
                    description: t('events:pricing.templates.studentDesc', 'Discounted rate for students'),
                    tiers: [
                        { id: 'tier-t-3', name: t('events:pricing.templates.studentPrice', 'Student Price'), price: '15', available_quantity: '30' }
                    ]
                }
            ]
        }
    ];

    const applyTemplate = (template) => {
        if (hasExistingData) {
            const confirmed = window.confirm(
                t('events:pricing.templates.confirmReplace',
                  'This will replace your current pricing structure. Are you sure?')
            );
            if (!confirmed) return;
        }

        handleChange('categories', template.categories);

        // Switch to Categories tab to show the applied template
        setActiveTab(0);
    };

    const totalAvailableTickets = pricingData.categories.reduce((total, category) => {
        return total + (category.tiers || []).reduce((catTotal, tier) => {
            const quantity = parseInt(tier.available_quantity) || 0;
            return catTotal + (quantity > 0 ? quantity : 0);
        }, 0);
    }, 0);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {t('events:pricing.title', 'Pricing & Categories')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('events:pricing.description', 'Set up different pricing categories and tiers for your event.')}
            </Typography>

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab
                    icon={<CategoryIcon />}
                    label={t('events:pricing.tabs.categories', 'Categories & Pricing')}
                    iconPosition="start"
                />
                <Tab
                    icon={<ScheduleIcon />}
                    label={t('events:pricing.tabs.templates', 'Quick Templates')}
                    iconPosition="start"
                />
            </Tabs>

            {/* Templates Tab */}
            {activeTab === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('events:pricing.templates.title', 'Pricing Templates')}
                    </Typography>

                    {hasExistingData ? (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            {t('events:pricing.templates.existingDataWarning', 'You already have pricing configured. Applying a template will replace your current pricing structure.')}
                        </Alert>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {t('events:pricing.templates.description', 'Choose a template to quickly set up your pricing structure.')}
                        </Typography>
                    )}

                    <Grid container spacing={2}>
                        {pricingTemplates.map((template, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => applyTemplate(template)}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {template.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {template.description}
                                        </Typography>
                                        <Button variant="outlined" size="small" fullWidth>
                                            {t('events:pricing.templates.apply', 'Apply Template')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Categories & Pricing Tab */}
            {activeTab === 0 && (
                <Box>
                    {/* Summary Stats */}
                    {pricingData.categories.length > 0 && (
                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.neutral' }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {pricingData.categories.length}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('events:pricing.stats.categories', 'Categories')}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {pricingData.categories.reduce((total, cat) => total + (cat.tiers?.length || 0), 0)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('events:pricing.stats.tiers', 'Price Tiers')}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {totalAvailableTickets > 0 ? totalAvailableTickets : '∞'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('events:pricing.stats.tickets', 'Available Tickets')}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Add Category Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={addCategory}
                        >
                            {t('events:pricing.addCategory', 'Add Category')}
                        </Button>
                    </Box>

                    {/* No Categories Message */}
                    {pricingData.categories.length === 0 && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                {t('events:pricing.noCategories', 'No pricing categories defined. Add categories to create different ticket types and pricing tiers.')}
                            </Typography>
                        </Alert>
                    )}

                    {/* Categories List */}
                    {pricingData.categories.map((category, categoryIndex) => (
                        <Accordion key={category.id} defaultExpanded sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <CategoryIcon color="primary" />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6">
                                            {category.name || t('events:pricing.unnamedCategory', 'Unnamed Category')}
                                        </Typography>
                                        {category.description && (
                                            <Typography variant="caption" color="text.secondary">
                                                {category.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Chip
                                        label={`${category.tiers?.length || 0} ${t('events:pricing.tiers', 'tiers')}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {/* Category Settings */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <TextField
                                            fullWidth
                                            label={t('events:pricing.categoryName', 'Category Name')}
                                            value={category.name || ''}
                                            onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                                            placeholder={t('events:pricing.categoryNamePlaceholder', 'e.g., Standard, VIP, Student')}
                                            required
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
                                            <IconButton
                                                color="error"
                                                onClick={() => removeCategory(category.id)}
                                                title={t('events:pricing.removeCategory', 'Remove Category')}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label={t('events:pricing.categoryDescription', 'Description')}
                                            value={category.description || ''}
                                            onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                                            placeholder={t('events:pricing.categoryDescriptionPlaceholder', 'What\'s included in this category?')}
                                            multiline
                                            rows={2}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                {/* Pricing Tiers */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ flex: 1 }}>
                                        {t('events:pricing.priceTiers', 'Price Tiers')}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<PriceIcon />}
                                        onClick={() => addTier(category.id)}
                                    >
                                        {t('events:pricing.addTier', 'Add Tier')}
                                    </Button>
                                </Box>

                                {(!category.tiers || category.tiers.length === 0) && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {t('events:pricing.noTiers', 'No price tiers defined for this category. Add tiers to set different prices.')}
                                    </Alert>
                                )}

                                {(category.tiers || []).map((tier, tierIndex) => (
                                    <Card key={tier.id} variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                                                    {t('events:pricing.tier', 'Tier')} {tierIndex + 1}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeTier(category.id, tier.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('events:pricing.tierName', 'Tier Name')}
                                                        value={tier.name || ''}
                                                        onChange={(e) => updateTier(category.id, tier.id, 'name', e.target.value)}
                                                        placeholder={t('events:pricing.tierNamePlaceholder', 'e.g., Early Bird, Regular')}
                                                        required
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('events:pricing.originalPrice', 'Original Price')}
                                                        type="number"
                                                        value={tier.originalPrice || ''}
                                                        onChange={(e) => updateTier(category.id, tier.id, 'originalPrice', e.target.value)}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                                        }}
                                                        helperText={t('events:pricing.originalPriceHelp', 'Show crossed-out price for discounts')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('events:pricing.discountPercentage', 'Discount %')}
                                                        type="number"
                                                        value={tier.discountPercentage || ''}
                                                        onChange={(e) => updateTier(category.id, tier.id, 'discountPercentage', e.target.value)}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                        }}
                                                        helperText={t('events:pricing.discountPercentageHelp', 'Display discount badge')}
                                                        inputProps={{ min: 0, max: 100 }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('events:pricing.displayPrice', 'Price to display')}
                                                        type="number"
                                                        value={tier.price || ''}
                                                        onChange={(e) => updateTier(category.id, tier.id, 'price', e.target.value)}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                                        }}
                                                        helperText={t('events:pricing.displayPriceHelp', 'Final price shown to users')}
                                                        required
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('events:pricing.quantity', 'Available Quantity')}
                                                        type="number"
                                                        value={tier.available_quantity || ''}
                                                        onChange={(e) => updateTier(category.id, tier.id, 'available_quantity', e.target.value)}
                                                        helperText={t('events:pricing.quantityHelp', 'Leave empty for unlimited')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={tier.is_early_bird || false}
                                                                onChange={(e) => updateTier(category.id, tier.id, 'is_early_bird', e.target.checked)}
                                                            />
                                                        }
                                                        label={t('events:pricing.earlyBird', 'Early Bird Pricing')}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default PricingStep;
