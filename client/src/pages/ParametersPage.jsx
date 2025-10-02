import { Container, Typography, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Info, Gavel, Security, Language, Settings, Assignment, ShoppingCart, Policy } from '@mui/icons-material';
import { useExternalLink } from '../hooks/useExternalLink';
import WebViewOverlay from '../components/WebViewOverlay';

const ParametersPage = () => {
    const theme = useTheme();
    const { t } = useTranslation('navigation');
    const { openExternalLink, closeWebView, webViewState } = useExternalLink();

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
