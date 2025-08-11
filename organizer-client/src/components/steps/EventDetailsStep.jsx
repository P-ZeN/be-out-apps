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
    const { t } = useTranslation();

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
                Détails de l'événement
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Renseignez les informations principales de votre événement.
            </Typography>

            <Grid container spacing={3}>
                {/* Event Title */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Titre de l'événement"
                        value={data.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        placeholder="Ex: Concert de jazz au parc"
                    />
                </Grid>

                {/* Event Description */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t('Description')}
                        value={data.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        required
                        placeholder={t('Décrivez votre événement de manière attractive...')}
                    />
                </Grid>

                {/* Event Date */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <DateTimePicker
                        label={t('Date et heure')}
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
                        <InputLabel>{t('Catégorie')}</InputLabel>
                        <Select
                            value={data.category_id || ''}
                            onChange={(e) => handleChange('category_id', e.target.value)}
                            label={t('Catégorie')}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Price */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('Prix')}
                        value={data.price || ''}
                        onChange={(e) => handleChange('price', e.target.value)}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                        helperText={t('Laissez vide pour un événement gratuit')}
                    />
                </Grid>

                {/* Max Participants */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('Nombre maximum de participants')}
                        value={data.max_participants || ''}
                        onChange={(e) => handleChange('max_participants', e.target.value)}
                        helperText={t('Laissez vide pour illimité')}
                    />
                </Grid>

                {/* Tags */}
                <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('Tags')}</InputLabel>
                        <Select
                            multiple
                            value={data.tags || []}
                            onChange={handleTagsChange}
                            input={<OutlinedInput label={t('Tags')} />}
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
                            {t('Image de l\'événement')}
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<PhotoCamera />}
                            sx={{ mb: 1 }}
                        >
                            {t('Choisir une image')}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </Button>
                        {data.image && (
                            <Typography variant="body2" color="text.secondary">
                                {t('Fichier sélectionné:')} {data.image.name}
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
                        label={t('Prérequis ou conditions')}
                        value={data.requirements || ''}
                        onChange={(e) => handleChange('requirements', e.target.value)}
                        placeholder={t('Ex: Âge minimum 18 ans, tenue correcte exigée...')}
                        helperText={t('Indiquez les conditions particulières de participation')}
                    />
                </Grid>

                {/* Cancellation Policy */}
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('Politique d\'annulation')}
                        value={data.cancellation_policy || ''}
                        onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                        placeholder={t('Ex: Remboursement intégral jusqu\'à 48h avant l\'événement...')}
                        helperText={t('Décrivez les conditions de remboursement et d\'annulation')}
                    />
                </Grid>

                {/* Featured Event Toggle */}
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={data.is_featured || false}
                                onChange={(e) => handleChange('is_featured', e.target.checked)}
                            />
                        }
                        label={t('Événement mis en avant')}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {t('Les événements mis en avant apparaissent en priorité dans les recherches')}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EventDetailsStep;
