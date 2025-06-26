import React, { useState, useEffect } from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Chip,
} from "@mui/material";
import { Dashboard, Event, People, Receipt, History, TrendingUp, TrendingDown } from "@mui/icons-material";
import AdminService from "../services/adminService";

const SimpleDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && AdminService.isAdmin(user)) {
            loadDashboardStats();
        }
    }, [user]);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            setError("");
            const statsData = await AdminService.getDashboardStats();
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { label: "Tableau de bord", icon: <Dashboard /> },
        { label: "Statistiques", icon: <TrendingUp /> },
    ];

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Veuillez vous connecter pour accéder à l'administration.</Alert>
            </Container>
        );
    }

    if (!AdminService.isAdmin(user)) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">
                    Accès refusé. Vous n'avez pas les permissions d'administrateur.
                    {user && (
                        <div style={{ marginTop: "8px", fontSize: "0.875rem" }}>
                            Votre rôle actuel: {user.role || "non défini"}
                        </div>
                    )}
                </Alert>
            </Container>
        );
    }

    const renderStatsCard = (title, value, icon, color = "primary", trend = null) => (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" color={`${color}.main`}>
                            {value}
                        </Typography>
                        {trend && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {trend > 0 ? (
                                    <TrendingUp color="success" fontSize="small" />
                                ) : (
                                    <TrendingDown color="error" fontSize="small" />
                                )}
                                <Typography
                                    variant="body2"
                                    color={trend > 0 ? "success.main" : "error.main"}
                                    sx={{ ml: 0.5 }}>
                                    {Math.abs(trend)}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ color: `${color}.main` }}>{icon}</Box>
                </Box>
            </CardContent>
        </Card>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <Box>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {loading ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            stats && (
                                <Box sx={{ flexGrow: 1 }}>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            {renderStatsCard(
                                                "Total Événements",
                                                AdminService.formatNumber(stats.totalEvents),
                                                <Event fontSize="large" />,
                                                "primary"
                                            )}
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            {renderStatsCard(
                                                "Total Utilisateurs",
                                                AdminService.formatNumber(stats.totalUsers),
                                                <People fontSize="large" />,
                                                "info"
                                            )}
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            {renderStatsCard(
                                                "Total Réservations",
                                                AdminService.formatNumber(stats.totalBookings),
                                                <Receipt fontSize="large" />,
                                                "success"
                                            )}
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            {renderStatsCard(
                                                "Revenus Totaux",
                                                AdminService.formatCurrency(stats.totalRevenue),
                                                <TrendingUp fontSize="large" />,
                                                "warning"
                                            )}
                                        </Grid>

                                        <Grid size={12}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>
                                                        Informations de l'administrateur
                                                    </Typography>
                                                    <Box display="flex" gap={2} alignItems="center">
                                                        <Typography variant="body1">
                                                            <strong>Email:</strong> {user.email}
                                                        </Typography>
                                                        <Chip
                                                            label={user.role === "admin" ? "Super Admin" : "Modérateur"}
                                                            color={user.role === "admin" ? "error" : "warning"}
                                                            size="small"
                                                        />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )
                        )}
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Alert severity="info">Section statistiques détaillées - À développer</Alert>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Administration Be Out
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Tableau de bord administrateur
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto">
                    {tabs.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} label={tab.label} iconPosition="start" />
                    ))}
                </Tabs>
            </Box>

            {renderTabContent()}
        </Container>
    );
};

export default SimpleDashboard;
