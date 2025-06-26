import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Button,
    Paper,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Stack,
    Divider,
    Avatar,
} from "@mui/material";
import {
    Schedule,
    LocationOn,
    Search,
    Favorite,
    FavoriteOutlined,
    Sort,
    TrendingUp,
    Event,
    Euro,
    Category,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import FavoritesService from "../services/favoritesService";
import FavoriteButton from "../components/FavoriteButton";

const Favorites = () => {
    const theme = useTheme();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [favorites, setFavorites] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false); // Track if a request is in progress

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (user?.id) {
            loadFavorites(true); // Always reset on initial load or filter change
            loadStats();
        }
    }, [isAuthenticated, user?.id, sortBy, searchTerm]); // Combine all dependencies into one useEffect

    const loadFavorites = async (reset = false) => {
        if (!user || loadingRef.current) return; // Use ref to prevent multiple calls

        try {
            loadingRef.current = true; // Set flag to prevent concurrent calls
            setLoading(true);
            setError("");

            const currentPage = reset ? 1 : page;
            const params = {
                page: currentPage,
                limit: 12,
                sortBy,
                ...(searchTerm && { search: searchTerm }),
            };

            const data = await FavoritesService.getUserFavorites(user.id, params);
            const formattedData = FavoritesService.formatFavorites(data);

            if (reset) {
                setFavorites(formattedData.favorites);
                setPage(1);
            } else {
                setFavorites((prev) => [...prev, ...formattedData.favorites]);
            }

            setHasMore(formattedData.pagination.page < formattedData.pagination.pages);

            if (reset) {
                setPage(2); // Set to 2 for next load
            } else {
                setPage((prev) => prev + 1);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            loadingRef.current = false; // Reset flag when request completes
        }
    };

    const loadStats = async () => {
        if (!user) return;

        try {
            const statsData = await FavoritesService.getFavoritesStats(user.id);
            setStats(statsData);
        } catch (err) {
            console.error("Error loading stats:", err);
        }
    };

    const handleFavoriteChange = (isFavorited, eventId) => {
        if (!isFavorited) {
            // Remove from favorites list
            setFavorites((prev) => prev.filter((fav) => fav.id !== eventId));

            // Update stats
            if (stats) {
                setStats((prev) => ({
                    ...prev,
                    total_favorites: Math.max(0, parseInt(prev.total_favorites) - 1),
                    upcoming_favorites: Math.max(0, parseInt(prev.upcoming_favorites) - 1),
                }));
            }
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPrice = (price) => {
        return `${parseFloat(price).toFixed(2)}€`;
    };

    const renderStatsCard = (title, value, icon, color = "primary") => (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h5" color={`${color}.main`} sx={{ fontWeight: "bold" }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{ color: `${color}.main` }}>{icon}</Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (!isAuthenticated) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info">Veuillez vous connecter pour voir vos favoris.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
                    Mes favoris
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Tous vos événements préférés en un seul endroit
                </Typography>
            </Box>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        {renderStatsCard(
                            "Total favoris",
                            stats.total_favorites || 0,
                            <Favorite fontSize="large" />,
                            "error"
                        )}
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        {renderStatsCard(
                            "À venir",
                            stats.upcoming_favorites || 0,
                            <Event fontSize="large" />,
                            "primary"
                        )}
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        {renderStatsCard(
                            "Prix moyen",
                            stats.avg_favorite_price ? formatPrice(stats.avg_favorite_price) : "0€",
                            <Euro fontSize="large" />,
                            "success"
                        )}
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        {renderStatsCard(
                            "Catégories",
                            stats.favorite_categories_count || 0,
                            <Category fontSize="large" />,
                            "warning"
                        )}
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher dans vos favoris..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel>Trier par</InputLabel>
                            <Select
                                value={sortBy}
                                label="Trier par"
                                onChange={(e) => setSortBy(e.target.value)}
                                startAdornment={<Sort sx={{ mr: 1 }} />}>
                                <MenuItem value="created_at">Récemment ajoutés</MenuItem>
                                <MenuItem value="event_date">Date d'événement</MenuItem>
                                <MenuItem value="price_asc">Prix croissant</MenuItem>
                                <MenuItem value="price_desc">Prix décroissant</MenuItem>
                                <MenuItem value="popularity">Popularité</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                            {favorites.length} favori{favorites.length > 1 ? "s" : ""}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Favorites Grid */}
            {loading && favorites.length === 0 ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : favorites.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: "center" }}>
                    <FavoriteOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Aucun favori pour le moment
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Explorez nos événements et ajoutez vos préférés à cette liste !
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/")}>
                        Découvrir les événements
                    </Button>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {favorites.map((favorite) => (
                            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={`favorite-${favorite.favorite_id}`}>
                                <Card
                                    sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative",
                                    }}>
                                    {/* Favorite Button */}
                                    <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
                                        <FavoriteButton
                                            eventId={favorite.id}
                                            initialIsFavorited={true}
                                            onFavoriteChange={(isFavorited) =>
                                                handleFavoriteChange(isFavorited, favorite.id)
                                            }
                                            sx={{
                                                backgroundColor: theme.palette.background.paper,
                                                "&:hover": {
                                                    backgroundColor: theme.palette.background.paper,
                                                },
                                            }}
                                        />
                                    </Box>

                                    {/* Event Image */}
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={favorite.image_url || "/placeholder-event.jpg"}
                                        alt={favorite.title}
                                        sx={{ cursor: "pointer" }}
                                        onClick={() => navigate(`/event/${favorite.id}`)}
                                    />

                                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                        {/* Event Title */}
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                "&:hover": { color: "primary.main" },
                                            }}
                                            onClick={() => navigate(`/event/${favorite.id}`)}>
                                            {favorite.title}
                                        </Typography>

                                        {/* Event Info */}
                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <Schedule sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(favorite.event_date)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <LocationOn sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {favorite.venue.name}, {favorite.venue.city}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {/* Categories */}
                                        {favorite.categories && favorite.categories.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                {favorite.categories.slice(0, 2).map((category) => (
                                                    <Chip
                                                        key={category}
                                                        label={category}
                                                        size="small"
                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        <Box sx={{ flexGrow: 1 }} />

                                        {/* Price and Actions */}
                                        <Divider sx={{ my: 2 }} />
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                                {formatPrice(favorite.discounted_price)}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => navigate(`/event/${favorite.id}`)}>
                                                Voir détails
                                            </Button>
                                        </Box>

                                        {/* Favorited date */}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 1, textAlign: "center" }}>
                                            Ajouté le {new Date(favorite.favorited_at).toLocaleDateString("fr-FR")}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Load More Button */}
                    {hasMore && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Button
                                variant="outlined"
                                onClick={() => loadFavorites()}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}>
                                {loading ? "Chargement..." : "Charger plus"}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default Favorites;
