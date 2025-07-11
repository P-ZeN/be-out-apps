import React from "react";
import { Box, Typography, Card, CardContent, Grid, TextField } from "@mui/material";

const SettingsTab = ({ settings, setSettings }) => {
    const handleSettingChange = (settingId, value) => {
        const newSettings = settings.map((s) => (s.id === settingId ? { ...s, setting_value: value } : s));
        setSettings(newSettings);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Paramètres Email
            </Typography>
            <Grid container spacing={3}>
                {settings.map((setting) => (
                    <Grid size={{ xs: 12, md: 6 }} key={setting.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{setting.setting_key}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {setting.description}
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={setting.setting_value}
                                    onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                                    size="small"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default SettingsTab;
