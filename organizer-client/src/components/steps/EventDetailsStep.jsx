import React from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Chip,
    OutlinedInput,
    Typography,
    Grid,
    InputAdornment,
    Button,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { PhotoCamera } from "@mui/icons-material";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const EventDetailsStep = ({ data, onChange, categories, onImageChange }) => {
    const { t } = useTranslation('organizer');

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleChange('image', file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageChange(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTagsChange = (event) => {
        const value = event.target.value;
        const tags = typeof value === 'string' ? value.split(',') : value;
        handleChange('tags', tags);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {t('events:details.title')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('events:details.description')}
            </Typography>

            <Grid container spacing={3}>
                {/* Event Title */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label={t('events:details.fields.title')}
                        value={data.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        placeholder={t('events:details.fields.titlePlaceholder')}
                    />
                </Grid>

                {/* Event Description */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t('events:details.fields.description')}
                        value={data.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        required
                        placeholder={t('events:details.fields.descriptionPlaceholder')}
                    />
                </Grid>

                {/* Event Date */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <DateTimePicker
                        label={t('events:details.fields.dateTime')}
                        value={data.event_date}
                        onChange={(newValue) => handleChange('event_date', newValue)}
                        format="dd/MM/yyyy HH:mm"
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                required: true,
                            },
                        }}
                    />
                </Grid>

                {/* Category */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                        <InputLabel>{t('events:details.fields.category')}</InputLabel>
                        <Select
                            value={data.category_id || ''}
                            onChange={(e) => handleChange('category_id', e.target.value)}
                            label={t('events:details.fields.category')}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Original Price */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('events:originalPrice', 'Prix original')}
                        value={data.original_price || ''}
                        onChange={(e) => {
                            const originalPrice = e.target.value;

                            // Calculate dependent values immediately
                            let newDiscountedPrice = data.discounted_price;
                            let newDiscountPercentage = data.discount_percentage;

                            if (originalPrice && data.discount_percentage) {
                                const newOriginalPrice = parseFloat(originalPrice);
                                const discountPercent = parseFloat(data.discount_percentage);
                                if (newOriginalPrice > 0 && discountPercent >= 0) {
                                    newDiscountedPrice = (newOriginalPrice * (1 - discountPercent / 100)).toFixed(2);
                                }
                            } else if (originalPrice && !data.discount_percentage) {
                                // If no discount percentage, set discounted price equal to original
                                newDiscountedPrice = originalPrice;
                                newDiscountPercentage = 0;
                            }

                            // Update all values at once
                            onChange({
                                ...data,
                                original_price: originalPrice,
                                discounted_price: newDiscountedPrice,
                                discount_percentage: newDiscountPercentage
                            });
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                        helperText={t('events:originalPriceHint', 'Prix affiché avant réduction')}
                    />
                </Grid>

                {/* Discounted Price */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('events:discountedPrice', 'Prix réduit')}
                        value={data.discounted_price || ''}
                        onChange={(e) => {
                            const discountedPrice = e.target.value;

                            // Calculate dependent values immediately
                            let newDiscountPercentage = data.discount_percentage;

                            // Auto-calculate discount percentage
                            if (data.original_price && discountedPrice) {
                                const originalPrice = parseFloat(data.original_price);
                                const newDiscountedPrice = parseFloat(discountedPrice);
                                if (originalPrice > 0 && newDiscountedPrice >= 0) {
                                    newDiscountPercentage = Math.round(((originalPrice - newDiscountedPrice) / originalPrice) * 100);
                                    newDiscountPercentage = Math.max(0, Math.min(100, newDiscountPercentage));
                                }
                            }

                            // Update all values at once
                            onChange({
                                ...data,
                                discounted_price: discountedPrice,
                                discount_percentage: newDiscountPercentage
                            });
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                        helperText={t('events:discountedPriceHint', 'Prix final payé par les utilisateurs')}
                    />
                </Grid>

                {/* Discount Percentage (Auto-calculated but editable) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('events:discountPercentage', 'Réduction (%)')}
                        value={data.discount_percentage || ''}
                        onChange={(e) => {
                            const percentage = e.target.value;

                            // Calculate dependent values immediately
                            let newDiscountedPrice = data.discounted_price;

                            // Auto-calculate discounted price if original price exists
                            if (data.original_price && percentage) {
                                const originalPrice = parseFloat(data.original_price);
                                const discountPercent = parseFloat(percentage);
                                if (originalPrice > 0 && discountPercent >= 0) {
                                    newDiscountedPrice = (originalPrice * (1 - discountPercent / 100)).toFixed(2);
                                }
                            }

                            // Update all values at once
                            onChange({
                                ...data,
                                discount_percentage: percentage,
                                discounted_price: newDiscountedPrice
                            });
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        helperText={t('events:discountPercentageHint', 'Pourcentage de réduction (synchronisé avec le prix réduit)')}
                        inputProps={{ min: 0, max: 100 }}
                    />
                </Grid>

                {/* Max Participants */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('events:maxParticipants')}
                        value={data.max_participants || ''}
                        onChange={(e) => handleChange('max_participants', e.target.value)}
                        helperText={t('events:unlimitedHint')}
                    />
                </Grid>

                {/* Tags */}
                <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('events:tags')}</InputLabel>
                        <Select
                            multiple
                            value={data.tags || []}
                            onChange={handleTagsChange}
                            input={<OutlinedInput label={t('events:tags')} />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                            MenuProps={MenuProps}
                        >
                            {['musique', 'concert', 'festival', 'sport', 'culture', 'art', 'théâtre', 'danse', 'famille', 'enfants', 'nature', 'gastronomie'].map((tag) => (
                                <MenuItem key={tag} value={tag}>
                                    {tag}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Event Image */}
                <Grid size={{ xs: 12 }}>
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            {t('events:eventImage')}
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<PhotoCamera />}
                            sx={{ mb: 1 }}
                        >
                            {t('events:chooseImage')}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </Button>
                        {data.image && (
                            <Typography variant="body2" color="text.secondary">
                                {t('events:selectedFile')} {data.image.name}
                            </Typography>
                        )}
                    </Box>
                </Grid>

                {/* Requirements */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events:requirements')}
                        value={data.requirements || ''}
                        onChange={(e) => handleChange('requirements', e.target.value)}
                        placeholder={t('events:requirementsPlaceholder')}
                        helperText={t('events:requirementsHelp')}
                    />
                </Grid>

                {/* Cancellation Policy */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events:cancellationPolicy')}
                        value={data.cancellation_policy || ''}
                        onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                        placeholder={t('events:cancellationPolicyPlaceholder')}
                        helperText={t('events:cancellationPolicyHelp')}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default EventDetailsStep;
