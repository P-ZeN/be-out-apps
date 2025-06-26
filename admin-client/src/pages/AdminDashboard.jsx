import React, { useState, useEffect } from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Paper,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Chip,
    Button,
    IconButton,
    Avatar,
} from "@mui/material";
import {
    Dashboard,
    Event,
    People,
    Receipt,
    Assessment,
    History,
    TrendingUp,
    TrendingDown,
    AccountCircle,
    AdminPanelSettings,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import AdminService from "../services/adminService";
import AdminEvents from "./AdminEvents";
import AdminUsers from "./AdminUsers";
import AdminBookings from "./AdminBookings";
import AdminLogs from "./AdminLogs";

const AdminDashboard = ({ user }) => {
    const theme = useTheme();
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
            const statsData = await AdminService.getDashboardStats(user.id);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { label: "Tableau de bord", icon: <Dashboard /> },
        { label: "Événements", icon: <Event /> },
        { label: "Utilisateurs", icon: <People /> },
        { label: "Réservations", icon: <Receipt /> },
        { label: "Journaux", icon: <History /> },
    ];

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Veuillez vous connecter pour accéder à l'administration.</Alert>
            </Container>
        );
    }

    if (!AdminService.isAdmin(user)) {
        console.log("Admin access denied. User:", user); // Debug log
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
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color: `${color}.main` }}>
                            {AdminService.formatNumber(value)}
                        </Typography>
                        {trend && (
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                {trend > 0 ? (
                                    <TrendingUp sx={{ fontSize: "1rem", color: "success.main", mr: 0.5 }} />
                                ) : (
                                    <TrendingDown sx={{ fontSize: "1rem", color: "error.main", mr: 0.5 }} />
                                )}
                                <Typography variant="body2" color={trend > 0 ? "success.main" : "error.main"}>
                                    {Math.abs(trend)}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const renderOverview = () => (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <AdminPanelSettings sx={{ mr: 2, fontSize: "2rem", color: "primary.main" }} />
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
                        Administration Be Out
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Bienvenue, {user.email} ({AdminService.getStatusLabel(user.role, "user")})
                    </Typography>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Stats Cards */}
            {!loading && stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        {renderStatsCard("Total Événements", stats.total_events, <Event />, "primary")}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        {renderStatsCard("Utilisateurs", stats.total_users, <People />, "info")}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        {renderStatsCard("Réservations", stats.total_bookings, <Receipt />, "success")}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        {renderStatsCard(
                            "Chiffre d'affaires",
                            AdminService.formatCurrency(stats.total_revenue).replace("€", ""),
                            <Assessment />,
                            "warning"
                        )}
                    </Grid>
                </Grid>
            )}

            {/* Detailed Stats */}
            {!loading && stats && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                Statistiques des événements
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Événements actifs
                                </Typography>
                                <Chip label={stats.active_events} color="success" size="small" />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nouveaux ce mois
                                </Typography>
                                <Chip label={stats.new_events_month} color="info" size="small" />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Note moyenne
                                </Typography>
                                <Chip
                                    label={
                                        stats.average_rating
                                            ? `${parseFloat(stats.average_rating).toFixed(1)}/5`
                                            : "N/A"
                                    }
                                    color="warning"
                                    size="small"
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                Statistiques des utilisateurs
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nouveaux utilisateurs (30j)
                                </Typography>
                                <Chip label={stats.new_users_month} color="info" size="small" />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Administrateurs
                                </Typography>
                                <Chip label={stats.admin_users} color="error" size="small" />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total des avis
                                </Typography>
                                <Chip label={stats.total_reviews} color="default" size="small" />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                Réservations et revenus
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="success.main" sx={{ fontWeight: "bold" }}>
                                            {stats.confirmed_bookings}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Réservations confirmées
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: "bold" }}>
                                            {AdminService.formatCurrency(stats.total_revenue)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Chiffre d'affaires total
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="info.main" sx={{ fontWeight: "bold" }}>
                                            {stats.new_bookings_month}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Nouvelles réservations (30j)
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return renderOverview();
            case 1:
                return <AdminEvents />;
            case 2:
                return <AdminUsers />;
            case 3:
                return <AdminBookings />;
            case 4:
                return <AdminLogs />;
            default:
                return renderOverview();
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Tab Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto">
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" />
                    ))}
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {renderTabContent()}
        </Container>
    );
};

export default AdminDashboard;
