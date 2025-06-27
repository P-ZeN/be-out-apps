import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Avatar,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Alert,
    LinearProgress,
} from "@mui/material";
import { Event, TrendingUp, People, Euro, Add, CalendarToday, Warning, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import organizerService from "../services/organizerService";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { profile, isApproved, isOnboardingComplete } = useAuth();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, bookingsData, eventsData] = await Promise.allSettled([
                organizerService.getDashboardStats(30),
                organizerService.getRecentBookings(5),
                organizerService.getUpcomingEvents(5),
            ]);

            if (statsData.status === "fulfilled") setStats(statsData.value);
            if (bookingsData.status === "fulfilled") setRecentBookings(bookingsData.value);
            if (eventsData.status === "fulfilled") setUpcomingEvents(eventsData.value);
        } catch (err) {
            setError("Erreur lors du chargement des données");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isApproved) {
        return (
            <Box>
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => navigate("/profile")}>
                            Voir le profil
                        </Button>
                    }>
                    <Typography variant="subtitle2" gutterBottom>
                        Compte en attente d'approbation
                    </Typography>
                    <Typography variant="body2">
                        Votre compte organisateur est en cours de validation par notre équipe. Vous serez notifié par
                        email une fois l'approbation effectuée.
                    </Typography>
                </Alert>

                <Card>
                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                        <Warning sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Validation en cours
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Votre profil est en cours d'examen. Cette étape prend généralement 24-48h.
                        </Typography>
                        <Button variant="outlined" onClick={() => navigate("/profile")} startIcon={<Event />}>
                            Compléter mon profil
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Tableau de bord
                </Typography>
                <LinearProgress sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ height: 80 }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Bonjour, {profile?.company_name || "Organisateur"} 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Voici un aperçu de vos performances ce mois-ci
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")} size="large">
                    Nouvel événement
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Événements actifs
                                    </Typography>
                                    <Typography variant="h4">{stats?.total_events || 0}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                    <Event />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Réservations
                                    </Typography>
                                    <Typography variant="h4">{stats?.total_bookings || 0}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: "success.main" }}>
                                    <People />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Revenus
                                    </Typography>
                                    <Typography variant="h4">{formatCurrency(stats?.total_revenue)}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: "warning.main" }}>
                                    <Euro />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Tickets vendus
                                    </Typography>
                                    <Typography variant="h4">{stats?.total_tickets_sold || 0}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: "info.main" }}>
                                    <TrendingUp />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Bookings */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6">Réservations récentes</Typography>
                                <Button size="small" onClick={() => navigate("/bookings")}>
                                    Voir tout
                                </Button>
                            </Box>

                            {recentBookings.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                                    Aucune réservation récente
                                </Typography>
                            ) : (
                                <List>
                                    {recentBookings.map((booking, index) => (
                                        <React.Fragment key={booking.booking_id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: "success.light" }}>
                                                        <CheckCircle />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={booking.event_title}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {booking.customer_name} • {booking.quantity} billet(s)
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDate(booking.booking_date)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <Typography variant="subtitle2" color="success.main">
                                                    {formatCurrency(booking.total_price)}
                                                </Typography>
                                            </ListItem>
                                            {index < recentBookings.length - 1 && (
                                                <Divider variant="inset" component="li" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Upcoming Events */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6">Événements à venir</Typography>
                                <Button size="small" onClick={() => navigate("/events")}>
                                    Voir tout
                                </Button>
                            </Box>

                            {upcomingEvents.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 3 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Aucun événement programmé
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => navigate("/events/new")}
                                        size="small">
                                        Créer un événement
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {upcomingEvents.map((event, index) => (
                                        <React.Fragment key={event.event_id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: "primary.light" }}>
                                                        <CalendarToday />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={event.title}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2">{event.venue_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDate(event.event_date)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <Box sx={{ textAlign: "right" }}>
                                                    <Chip
                                                        label={`${event.total_bookings} réservations`}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                    <Typography variant="caption" display="block">
                                                        {formatCurrency(event.revenue)}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                            {index < upcomingEvents.length - 1 && (
                                                <Divider variant="inset" component="li" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
