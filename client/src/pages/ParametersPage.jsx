import { Container, Typography, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Divider, FormControlLabel, Switch, FormGroup, Alert, CircularProgress, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Info, Gavel, Security, Language, Settings, Assignment, ShoppingCart, Policy, Notifications, Email, Sms, PhoneAndroid, Schedule, Campaign } from '@mui/icons-material';
import { useExternalLink } from '../hooks/useExternalLink';
import WebViewOverlay from '../components/WebViewOverlay';
import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const ParametersPage = () => {
    const theme = useTheme();
    const { t } = useTranslation('navigation');
    const { openExternalLink, closeWebView, webViewState } = useExternalLink();
    const { user } = useAuth();

    // Notification settings state with guaranteed boolean values
    const [notificationSettings, setNotificationSettings] = useState({
        // Notification vectors
        nativeNotifications: true,
        smsNotifications: false,
        emailNotifications: true,
        // Reminders
        reminder24h: true,
        reminder2h: false,
        // News and opportunities
        beOutNews: true
    });

    const [isLoading, setIsLoading] = useState(false);
    const [syncError, setSyncError] = useState('');

    // Initialize notification service and sync preferences
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                await notificationService.initialize();

                if (user) {
                    // User is logged in, sync with server
                    setIsLoading(true);
                    const syncedPreferences = await notificationService.syncPreferences();
                    // Ensure all values are booleans
                    setNotificationSettings({
                        nativeNotifications: Boolean(syncedPreferences.nativeNotifications),
                        smsNotifications: Boolean(syncedPreferences.smsNotifications),
                        emailNotifications: Boolean(syncedPreferences.emailNotifications),
                        reminder24h: Boolean(syncedPreferences.reminder24h),
                        reminder2h: Boolean(syncedPreferences.reminder2h),
                        beOutNews: Boolean(syncedPreferences.beOutNews)
                    });
                } else {
                    // User not logged in, use local preferences
                    const localPreferences = notificationService.getLocalPreferences();
                    // Ensure all values are booleans
                    setNotificationSettings({
                        nativeNotifications: Boolean(localPreferences.nativeNotifications),
                        smsNotifications: Boolean(localPreferences.smsNotifications),
                        emailNotifications: Boolean(localPreferences.emailNotifications),
                        reminder24h: Boolean(localPreferences.reminder24h),
                        reminder2h: Boolean(localPreferences.reminder2h),
                        beOutNews: Boolean(localPreferences.beOutNews)
                    });
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
                setSyncError('Erreur lors du chargement des préférences');
                // Fall back to local preferences
                const localPreferences = notificationService.getLocalPreferences();
                // Ensure all values are booleans
                setNotificationSettings({
                    nativeNotifications: Boolean(localPreferences.nativeNotifications),
                    smsNotifications: Boolean(localPreferences.smsNotifications),
                    emailNotifications: Boolean(localPreferences.emailNotifications),
                    reminder24h: Boolean(localPreferences.reminder24h),
                    reminder2h: Boolean(localPreferences.reminder2h),
                    beOutNews: Boolean(localPreferences.beOutNews)
                });
            } finally {
                setIsLoading(false);
            }
        };

        initializeNotifications();
    }, [user]);

    const handleNotificationChange = (setting) => async (event) => {
        const newValue = event.target.checked;
        const newSettings = {
            ...notificationSettings,
            [setting]: newValue
        };

        // Update UI immediately
        setNotificationSettings(newSettings);
        setSyncError('');

        try {
            // Update both localStorage and server
            await notificationService.updatePreferences(newSettings);
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            setSyncError('Erreur lors de la sauvegarde. Vos préférences sont sauvegardées localement.');
        }
    };





    const showroomLinks = [
        {
            title: t('parameters.aboutBeOut', 'À propos de Be Out'),
            description: t('parameters.aboutDescription', 'Découvrez notre mission, nos valeurs et notre histoire'),
            icon: <Info color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net/about'
        },
        {
            title: t('parameters.website', 'Site web Be Out'),
            description: t('parameters.websiteDescription', 'Visitez notre site web principal'),
            icon: <Language color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net'
        },
        {
            title: t('parameters.cgu', 'Conditions Générales d\'Utilisation'),
            description: t('parameters.cguDescription', 'Conditions d\'utilisation de l\'application'),
            icon: <Assignment color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net/cgu'
        },
        {
            title: t('parameters.cgv', 'Conditions Générales de Vente'),
            description: t('parameters.cgvDescription', 'Conditions de vente et de réservation'),
            icon: <ShoppingCart color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net/cgv'
        },
        {
            title: t('parameters.mentions', 'Mentions légales'),
            description: t('parameters.mentionsDescription', 'Informations légales et responsabilités'),
            icon: <Gavel color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net/mentions-legales'
        },
        {
            title: t('parameters.privacy', 'Politique de confidentialité'),
            description: t('parameters.privacyDescription', 'Comment nous protégeons vos données personnelles'),
            icon: <Security color="primary" />,
            url: 'https://www.be-out-app.dedibox2.philippezenone.net/politique-confidentialite'
        }
    ];

    const handleLinkClick = (url, title) => {
        openExternalLink(url, title);
    };

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Settings
                    sx={{
                        fontSize: 40,
                        color: theme.palette.primary.main,
                        mr: 2
                    }}
                />
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        color: theme.palette.primary.main,
                        mb: 0
                    }}
                >
                    {t('parameters.title', 'Paramètres')}
                </Typography>
            </Box>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                    mb: 4,
                    textAlign: 'center',
                    maxWidth: 600,
                    mx: 'auto'
                }}
            >
                {t('parameters.subtitle', 'Accédez aux informations importantes sur Be Out')}
            </Typography>

            {/* Notification Settings Section */}
            <Box sx={{ mb: 4 }}>
                {/* Error display */}
                {syncError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {syncError}
                    </Alert>
                )}

                {/* Loading state */}
                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            {t('parameters.notifications.loading', 'Chargement des préférences...')}
                        </Typography>
                    </Box>
                )}

                {/* Notification Vectors */}
                <Paper elevation={2} sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Notifications color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="primary">
                            {t('parameters.notifications.title', 'Notifications')}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('parameters.notifications.subtitle', 'Choisissez comment vous souhaitez recevoir vos notifications')}
                    </Typography>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.nativeNotifications}
                                    onChange={handleNotificationChange('nativeNotifications')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PhoneAndroid sx={{ mr: 1, fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body1">
                                            {t('parameters.notifications.native', 'Notifications natives')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('parameters.notifications.nativeDesc', 'Notifications push sur votre appareil')}
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.smsNotifications}
                                    onChange={handleNotificationChange('smsNotifications')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Sms sx={{ mr: 1, fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body1">
                                            {t('parameters.notifications.sms', 'Notifications SMS')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('parameters.notifications.smsDesc', 'Messages texte sur votre téléphone')}
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.emailNotifications}
                                    onChange={handleNotificationChange('emailNotifications')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Email sx={{ mr: 1, fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body1">
                                            {t('parameters.notifications.email', 'Notifications par email')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('parameters.notifications.emailDesc', 'Emails de confirmation et rappels')}
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                        />
                    </FormGroup>
                </Paper>

                {/* Reminders */}
                <Paper elevation={2} sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Schedule color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="primary">
                            {t('parameters.reminders.title', 'Rappels d\'événements')}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('parameters.reminders.subtitle', 'Recevez des rappels avant vos événements réservés')}
                    </Typography>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.reminder24h}
                                    onChange={handleNotificationChange('reminder24h')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t('parameters.reminders.24h', 'Rappel 24h avant')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('parameters.reminders.24hDesc', 'Notification la veille de l\'événement')}
                                    </Typography>
                                </Box>
                            }
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.reminder2h}
                                    onChange={handleNotificationChange('reminder2h')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t('parameters.reminders.2h', 'Rappel 2h avant')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('parameters.reminders.2hDesc', 'Notification 2 heures avant l\'événement')}
                                    </Typography>
                                </Box>
                            }
                        />
                    </FormGroup>
                </Paper>

                {/* Be Out News and Opportunities */}
                <Paper elevation={2} sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Campaign color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="primary">
                            {t('parameters.news.title', 'Actualités Be Out')}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('parameters.news.subtitle', 'Restez informé des nouveautés et opportunités')}
                    </Typography>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!notificationSettings.beOutNews}
                                    onChange={handleNotificationChange('beOutNews')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t('parameters.news.updates', 'Nouveautés et opportunités')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('parameters.news.updatesDesc', 'Nouveaux événements, promotions et fonctionnalités')}
                                    </Typography>
                                </Box>
                            }
                        />
                    </FormGroup>
                </Paper>
            </Box>

            {/* Legal and Information Links */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                {t('parameters.information.title', 'Informations')}
            </Typography>

            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <List disablePadding>
                    {showroomLinks.map((link, index) => (
                        <Box key={link.url}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => handleLinkClick(link.url, link.title)}
                                    sx={{
                                        py: 2,
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 48 }}>
                                        {link.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={link.title}
                                        secondary={link.description}
                                        primaryTypographyProps={{
                                            variant: 'subtitle1',
                                            fontWeight: 500,
                                            color: theme.palette.text.primary
                                        }}
                                        secondaryTypographyProps={{
                                            variant: 'body2',
                                            color: theme.palette.text.secondary
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            {index < showroomLinks.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {t('parameters.note', 'Ces liens s\'ouvriront dans un nouvel onglet')}
                </Typography>
            </Box>

            {/* WebView Overlay for mobile external links */}
            <WebViewOverlay
                url={webViewState.url}
                title={webViewState.title}
                open={webViewState.open}
                onClose={closeWebView}
            />
        </Container>
    );
};

export default ParametersPage;
