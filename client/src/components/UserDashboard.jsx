import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Avatar,
    Chip,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Paper,
    IconButton,
    Grid,
} from '@mui/material';
import {
    Person,
    Event,
    Favorite,
    Receipt,
    LocationOn,
    Schedule,
    TrendingUp,
    Star,
    Add,
    ArrowForward,
    Celebration,
    LocalActivity,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BookingService from '../services/bookingService';
import FavoritesService from '../services/favoritesService';

const UserDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState({
        recentBookings: [],
        recentFavorites: [],
        stats: {
            totalBookings: 0,
            totalFavorites: 0,
            upcomingEvents: 0,
            totalSpent: 0,
        }
    });

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
        }
    }, [user?.id]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            // Load recent bookings
            const bookingsResponse = await BookingService.getUserBookings(user.id, {
                page: 1,
                limit: 5
            });

            // Load recent favorites
            const favoritesResponse = await FavoritesService.getUserFavorites(user.id, {
                page: 1,
                limit: 5
            });

            // Load favorites stats
            const favoritesStats = await FavoritesService.getFavoritesStats(user.id);

            // Calculate stats from bookings
            const confirmedBookings = bookingsResponse.bookings.filter(b => b.booking_status === 'confirmed');
            const upcomingBookings = confirmedBookings.filter(b => new Date(b.event_date) > new Date());
            const totalSpent = confirmedBookings.reduce((sum, booking) => sum + parseFloat(booking.total_price), 0);

            setDashboardData({
                recentBookings: bookingsResponse.bookings,
                recentFavorites: favoritesResponse.favorites,
                stats: {
                    totalBookings: confirmedBookings.length,
                    totalFavorites: parseInt(favoritesStats.total_favorites) || 0,
                    upcomingEvents: upcomingBookings.length,
                    totalSpent: totalSpent,
                }
            });
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed':
                return 'Confirmée';
            case 'pending':
                return 'En attente';
            case 'cancelled':
                return 'Annulée';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Welcome Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            mr: 2,
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem'
                        }}
                    >
                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                            Bonjour, {user?.first_name || user?.email?.split('@')[0] || 'Utilisateur'} ! 👋
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Bienvenue sur votre tableau de bord Be-Out
                        </Typography>
                    </Box>
                </Box>

                {/* Quick Stats */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
                            <CardContent sx={{ color: 'white', textAlign: 'center', py: 2 }}>
                                <Receipt sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {dashboardData.stats.totalBookings}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Réservations
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E88 90%)' }}>
                            <CardContent sx={{ color: 'white', textAlign: 'center', py: 2 }}>
                                <Favorite sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {dashboardData.stats.totalFavorites}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Favoris
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)' }}>
                            <CardContent sx={{ color: 'white', textAlign: 'center', py: 2 }}>
                                <Event sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {dashboardData.stats.upcomingEvents}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    À venir
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)' }}>
                            <CardContent sx={{ color: 'white', textAlign: 'center', py: 2 }}>
                                <TrendingUp sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(dashboardData.stats.totalSpent)}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Dépensé
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Recent Bookings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Mes dernières réservations
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForward />}
                                    onClick={() => navigate('/bookings')}
                                >
                                    Voir tout
                                </Button>
                            </Box>

                            {dashboardData.recentBookings.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <LocalActivity sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Aucune réservation pour le moment
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => navigate('/events')}
                                    >
                                        Découvrir les événements
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {dashboardData.recentBookings.map((booking, index) => (
                                        <React.Fragment key={booking.id}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                                                        <Receipt />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={booking.event_title}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatDate(booking.event_date)}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <Chip
                                                                    label={getStatusLabel(booking.booking_status)}
                                                                    color={getStatusColor(booking.booking_status)}
                                                                    size="small"
                                                                />
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                    {formatCurrency(booking.total_price)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </ListItem>
                                            {index < dashboardData.recentBookings.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Favorites */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Mes derniers favoris
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForward />}
                                    onClick={() => navigate('/favorites')}
                                >
                                    Voir tout
                                </Button>
                            </Box>

                            {dashboardData.recentFavorites.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Star sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Aucun favori pour le moment
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Favorite />}
                                        onClick={() => navigate('/events')}
                                    >
                                        Découvrir les événements
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {dashboardData.recentFavorites.map((favorite, index) => (
                                        <React.Fragment key={favorite.id}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'error.light' }}>
                                                        <Favorite />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={favorite.title}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatDate(favorite.event_date)}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {favorite.venue_name}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/event/${favorite.id}`)}
                                                >
                                                    <ArrowForward />
                                                </IconButton>
                                            </ListItem>
                                            {index < dashboardData.recentFavorites.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid size={12}>
                    <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Actions rapides
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                    startIcon={<Event />}
                                    onClick={() => navigate('/events')}
                                >
                                    Événements
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                    startIcon={<LocationOn />}
                                    onClick={() => navigate('/map')}
                                >
                                    Carte
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                    startIcon={<Person />}
                                    onClick={() => navigate('/profile')}
                                >
                                    Profil
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                    startIcon={<Favorite />}
                                    onClick={() => navigate('/favorites')}
                                >
                                    Favoris
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Promotional Banner */}
                <Grid size={12}>
                    <Card sx={{ background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Celebration sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Découvrez les événements près de chez vous !
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                                Ne manquez plus aucun événement grâce à nos notifications personnalisées
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                                onClick={() => navigate('/events')}
                            >
                                Explorer maintenant
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default UserDashboard;
