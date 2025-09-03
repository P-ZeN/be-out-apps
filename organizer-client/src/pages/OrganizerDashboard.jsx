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
import { useTranslation } from 'react-i18next';
import { useAuth } from "../context/AuthContext";
import organizerService from "../services/organizerService";

const Dashboard = () => {
    const { t } = useTranslation('organizer');
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
            setError(t('dashboard.errors.loadingData'));
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
                        {t('dashboard.buttons.awaitingApproval')}
                    </Typography>
                    <Typography variant="body2">
                        {t('dashboard.status.approvalPending')}
                    </Typography>
                </Alert>

                <Card>
                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                        <Warning sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            {t('dashboard.status.validationInProgress')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {t('dashboard.status.profileUnderReview')}
                        </Typography>
                        <Button variant="outlined" onClick={() => navigate("/profile")} startIcon={<Event />}>
                            {t('dashboard.buttons.completeProfile')}
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
                    {t('navigation.dashboard')}
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
                        {t('dashboard.welcome.greeting', { name: profile?.company_name || t('dashboard.welcome.defaultName') })}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('dashboard.welcome.subtitle')}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")} size="large">
                    {t('dashboard.buttons.newEvent')}
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
                                        {t('dashboard.stats.activeEvents')}
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
                                        {t('dashboard.stats.bookings')}
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
                                        {t('dashboard.stats.revenue')}
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
                                        {t('dashboard.stats.ticketsSold')}
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
                                <Typography variant="h6">{t('dashboard.sections.recentBookings.title')}</Typography>
                                <Button size="small" onClick={() => navigate("/bookings")}>
                                    {t('dashboard.sections.recentBookings.viewAll')}
                                </Button>
                            </Box>

                            {recentBookings.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                                    {t('dashboard.sections.recentBookings.empty')}
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
                                                                {booking.customer_name} • {booking.quantity} {t('dashboard.sections.recentBookings.tickets')}
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
                                <Typography variant="h6">{t('dashboard.sections.upcomingEvents.title')}</Typography>
                                <Button size="small" onClick={() => navigate("/events")}>
                                    {t('dashboard.sections.upcomingEvents.viewAll')}
                                </Button>
                            </Box>

                            {upcomingEvents.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 3 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {t('dashboard.sections.upcomingEvents.empty')}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => navigate("/events/new")}
                                        size="small">
                                        {t('dashboard.sections.upcomingEvents.createEvent')}
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
                                                        label={`${event.total_bookings} ${t('dashboard.sections.upcomingEvents.bookings')}`}
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
