import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import { TrendingUp, Event, BookOnline, Euro, Add, Visibility, CalendarToday } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import organizerService from "../services/organizerService";

const StatCard = ({ title, value, subtitle, icon, color = "primary" }) => (
    <Card sx={{ height: "100%" }}>
        <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: `${color}.light`,
                        color: `${color}.contrastText`,
                        mr: 2,
                    }}>
                    {icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
            <Typography variant="h6" color="text.primary">
                {title}
            </Typography>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { profile } = useAuth();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, eventsData, bookingsData] = await Promise.all([
                organizerService.getDashboardStats(30),
                organizerService.getUpcomingEvents(5),
                organizerService.getRecentBookings(5),
            ]);

            setStats(statsData);
            setUpcomingEvents(eventsData);
            setRecentBookings(bookingsData);
        } catch (error) {
            setError("Erreur lors du chargement des données");
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile?.status || profile.status === "pending") {
        return (
            <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Compte en attente d'approbation
                    </Typography>
                    <Typography variant="body2">
                        Votre compte organisateur est en cours de validation par notre équipe. Vous recevrez un email
                        dès que votre compte sera approuvé et que vous pourrez commencer à créer vos événements.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    if (profile?.status === "rejected") {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Compte rejeté
                    </Typography>
                    <Typography variant="body2">
                        Votre demande de compte organisateur a été rejetée. Veuillez contacter notre support pour plus
                        d'informations.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Tableau de bord
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Bienvenue, {profile?.company_name || "Organisateur"} ! Voici un aperçu de vos activités.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")} size="large">
                    Créer un événement
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Événements actifs"
                        value={stats?.total_events || 0}
                        subtitle="Ce mois"
                        icon={<Event />}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Réservations"
                        value={stats?.total_bookings || 0}
                        subtitle="Ce mois"
                        icon={<BookOnline />}
                        color="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Revenus"
                        value={`${stats?.total_revenue || 0}€`}
                        subtitle="Ce mois"
                        icon={<Euro />}
                        color="warning"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Billets vendus"
                        value={stats?.total_tickets_sold || 0}
                        subtitle="Ce mois"
                        icon={<TrendingUp />}
                        color="info"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Upcoming Events */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Événements à venir
                                </Typography>
                                <Button size="small" endIcon={<Visibility />} onClick={() => navigate("/events")}>
                                    Voir tout
                                </Button>
                            </Box>

                            {upcomingEvents.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 3 }}>
                                    <CalendarToday sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Aucun événement à venir
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => navigate("/events/new")}
                                        sx={{ mt: 2 }}>
                                        Créer un événement
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {upcomingEvents.map((event) => (
                                        <ListItem key={event.event_id || event.id} divider>
                                            <ListItemText
                                                primary={event.title}
                                                secondary={
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="div">
                                                            {new Date(event.event_date).toLocaleDateString("fr-FR", {
                                                                weekday: "long",
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="div">
                                                            {event.venue_name}
                                                        </Typography>
                                                        <Box sx={{ mt: 1 }}>
                                                            <Chip
                                                                size="small"
                                                                label={`${event.total_bookings || 0} réservations`}
                                                                color="primary"
                                                                variant="outlined"
                                                                sx={{ mr: 1 }}
                                                            />
                                                            <Chip
                                                                size="small"
                                                                label={`${event.revenue || 0}€`}
                                                                color="success"
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </Box>
                                                }
                                                secondaryTypographyProps={{ component: "div" }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Bookings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Réservations récentes
                                </Typography>
                                <Button size="small" endIcon={<Visibility />} onClick={() => navigate("/bookings")}>
                                    Voir tout
                                </Button>
                            </Box>

                            {recentBookings.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 3 }}>
                                    <BookOnline sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Aucune réservation récente
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {recentBookings.map((booking) => (
                                        <ListItem key={booking.booking_id || booking.id} divider>
                                            <ListItemText
                                                primary={booking.customer_name || booking.customer_email}
                                                secondary={
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="div">
                                                            {booking.event_title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="div">
                                                            {booking.quantity} billet(s) - {booking.total_price}€
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div">
                                                            {new Date(booking.booking_date).toLocaleDateString("fr-FR")}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondaryTypographyProps={{ component: "div" }}
                                            />
                                        </ListItem>
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
