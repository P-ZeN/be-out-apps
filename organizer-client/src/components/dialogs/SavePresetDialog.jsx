import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Box,
    Typography
} from '@mui/material';

const SavePresetDialog = ({ open, onClose, onSave, currentCustomizations }) => {
    const { t } = useTranslation('organizer');
    const [presetName, setPresetName] = useState('');
    const [description, setDescription] = useState('');
    const [setAsDefault, setSetAsDefault] = useState(false);

    const handleSave = () => {
        if (!presetName.trim()) return;

        onSave({
            name: presetName.trim(),
            description: description.trim(),
            customizations: currentCustomizations,
            is_default: setAsDefault
        });

        // Reset form
        setPresetName('');
        setDescription('');
        setSetAsDefault(false);
        onClose();
    };

    const handleClose = () => {
        setPresetName('');
        setDescription('');
        setSetAsDefault(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t('organizer:tickets.design.presets.saveTitle', 'Save Design as Preset')}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <TextField
                        fullWidth
                        label={t('organizer:tickets.design.presets.presetName', 'Preset Name')}
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder={t('organizer:tickets.design.presets.presetNamePlaceholder', 'My Corporate Template')}
                        sx={{ mb: 2 }}
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        label={t('organizer:tickets.design.presets.presetDescription', 'Description (optional)')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('organizer:tickets.design.presets.descriptionPlaceholder', 'Blue corporate colors with QR code')}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={setAsDefault}
                                onChange={(e) => setSetAsDefault(e.target.checked)}
                            />
                        }
                        label={t('organizer:tickets.design.presets.setAsDefault', 'Use as default for new events')}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('organizer:tickets.design.presets.saveNote', 'This will save your current colors, QR code setup, custom message, and background image.')}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    {t('common:cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={!presetName.trim()}
                >
                    {t('organizer:tickets.design.presets.savePreset', 'Save Preset')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SavePresetDialog;
