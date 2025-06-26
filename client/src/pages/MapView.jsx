import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
} from "@mui/material";
import { Search, MyLocation, LocationOn, Schedule, LocalOffer } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const MapView = () => {
    const { t } = useTranslation(["home", "common"]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    // Mock events for map view
    const nearbyEvents = [
        {
            id: 1,
            title: "Concert Jazz au Sunset",
            category: "music",
            discountedPrice: 25,
            originalPrice: 45,
            discount: 44,
            distance: "2.5 km",
            location: "Paris 18e",
            isLastMinute: true,
            lat: 48.8566,
            lng: 2.3522,
        },
        {
            id: 2,
            title: "Match PSG vs OM",
            category: "sport",
            discountedPrice: 60,
            originalPrice: 80,
            discount: 25,
            distance: "5.2 km",
            location: "Parc des Princes",
            isLastMinute: false,
            lat: 48.8414,
            lng: 2.253,
        },
        {
            id: 3,
            title: "Spectacle Comédie Française",
            category: "theater",
            discountedPrice: 18,
            originalPrice: 35,
            discount: 49,
            distance: "3.8 km",
            location: "1er arrondissement",
            isLastMinute: true,
            lat: 48.8634,
            lng: 2.3365,
        },
    ];

    const handleEventClick = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
                    🗺️ Carte des Événements
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Découvrez les événements près de chez vous
                </Typography>

                {/* Search Bar */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Rechercher par lieu ou adresse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ maxWidth: "500px" }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton>
                                    <MyLocation />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Map Placeholder */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper
                        sx={{
                            height: "600px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "grey.100",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23c3c3c3' fill-opacity='0.1'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            borderRadius: 2,
                        }}>
                        <Box sx={{ textAlign: "center" }}>
                            <LocationOn sx={{ fontSize: "4rem", color: "grey.400", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Carte Interactive
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                La carte interactive sera intégrée ici
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                (Google Maps, Mapbox ou autre solution de cartographie)
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Events List */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                            Événements à proximité ({nearbyEvents.length})
                        </Typography>
                    </Box>

                    <Box sx={{ maxHeight: "600px", overflowY: "auto" }}>
                        {nearbyEvents.map((event) => (
                            <Card
                                key={event.id}
                                sx={{
                                    mb: 2,
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow: 2,
                                    },
                                }}
                                onClick={() => handleEventClick(event.id)}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            mb: 1,
                                        }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: "bold", flex: 1 }}>
                                            {event.title}
                                        </Typography>
                                        {event.isLastMinute && (
                                            <Chip label="Dernière minute" size="small" color="error" sx={{ ml: 1 }} />
                                        )}
                                    </Box>

                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <LocationOn sx={{ fontSize: "1rem", mr: 0.5, color: "text.secondary" }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {event.location} • {event.distance}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                                {event.discountedPrice}€
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                                {event.originalPrice}€
                                            </Typography>
                                            <Chip label={`-${event.discount}%`} size="small" color="success" />
                                        </Box>
                                        <Button size="small" variant="outlined">
                                            Voir
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => navigate("/")}>
                        Voir tous les événements
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

export default MapView;
