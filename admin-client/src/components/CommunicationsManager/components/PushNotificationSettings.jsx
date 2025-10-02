import React from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Chip,
    Alert,
    AlertTitle,
    Divider
} from "@mui/material";
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Notifications as NotificationsIcon
} from "@mui/icons-material";

const PushNotificationSettings = ({ settings, loading, onSave }) => {
    if (loading) {
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Chargement des paramètres...
                </Typography>
            </Box>
        );
    }

    if (!settings) {
        return (
            <Box>
                <Alert severity="error">
                    <AlertTitle>Erreur</AlertTitle>
                    Impossible de charger les paramètres de notification push.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <NotificationsIcon sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                    Paramètres des Notifications Push
                </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* VAPID Configuration Status */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                        {settings.vapidConfigured ? (
                            <CheckIcon color="success" sx={{ mr: 1 }} />
                        ) : (
                            <ErrorIcon color="error" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="h6">
                            Configuration VAPID
                        </Typography>
                        <Chip
                            label={settings.vapidConfigured ? "Configuré" : "Non configuré"}
                            color={settings.vapidConfigured ? "success" : "error"}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    </Box>

                    {!settings.vapidConfigured && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <AlertTitle>Configuration requise</AlertTitle>
                            Les clés VAPID ne sont pas configurées. Les notifications push ne fonctionneront pas.
                            <br />
                            Exécutez: <code>npx web-push generate-vapid-keys</code>
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary">
                        Les clés VAPID (Voluntary Application Server Identification) sont nécessaires
                        pour envoyer des notifications push via le protocole Web Push.
                    </Typography>
                </CardContent>
            </Card>

            {/* Settings Grid */}
            <Grid container spacing={3}>
                {/* Public Key */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Clé publique VAPID
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Clé publique utilisée pour l'identification du serveur
                            </Typography>
                            <TextField
                                fullWidth
                                value={settings.publicKey || "Non configuré"}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                                multiline
                                rows={3}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Subject */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Subject (Contact)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Adresse de contact pour les notifications push
                            </Typography>
                            <TextField
                                fullWidth
                                value={settings.subject || ""}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Default Icon */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Icône par défaut
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Chemin vers l'icône par défaut des notifications
                            </Typography>
                            <TextField
                                fullWidth
                                value={settings.defaultIcon || ""}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Default Badge */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Badge par défaut
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Chemin vers le badge par défaut des notifications
                            </Typography>
                            <TextField
                                fullWidth
                                value={settings.defaultBadge || ""}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* TTL */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                TTL (Time To Live)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Durée de vie des notifications en secondes
                            </Typography>
                            <TextField
                                fullWidth
                                value={`${settings.ttl || 0} secondes (${Math.round((settings.ttl || 0) / 3600)} heures)`}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Urgency */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Urgence
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Niveau d'urgence par défaut des notifications
                            </Typography>
                            <TextField
                                fullWidth
                                value={settings.urgency || "normal"}
                                InputProps={{
                                    readOnly: true,
                                }}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Configuration Instructions */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Instructions de configuration
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Pour configurer les notifications push, vous devez définir les variables d'environnement suivantes :
                    </Typography>
                    <Box component="pre" sx={{
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        overflow: 'auto'
                    }}>
{`VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@domain.com`}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Pour générer des clés VAPID, exécutez :
                    </Typography>
                    <Box component="pre" sx={{
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        mt: 1
                    }}>
                        npx web-push generate-vapid-keys
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PushNotificationSettings;
