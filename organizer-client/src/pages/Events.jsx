import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Alert,
} from "@mui/material";
import { Add, MoreVert, Edit, Delete, Visibility, CalendarToday, People, TrendingUp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import organizerService from "../services/organizerService";

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await organizerService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Error loading events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, eventData) => {
        setAnchorEl(event.currentTarget);
        setSelectedEvent(eventData);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedEvent(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "success";
            case "draft":
                return "warning";
            case "cancelled":
                return "error";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "active":
                return "Actif";
            case "draft":
                return "Brouillon";
            case "cancelled":
                return "Annulé";
            default:
                return status;
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Mes événements
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gérez vos événements et suivez leurs performances
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")} size="large">
                    Nouvel événement
                </Button>
            </Box>

            {events.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                        <CalendarToday sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Aucun événement créé
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Commencez par créer votre premier événement pour commencer à vendre des billets
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")}>
                            Créer mon premier événement
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {events.map((event) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={event.id}>
                            <Card>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            mb: 2,
                                        }}>
                                        <Chip
                                            label={getStatusLabel(event.status)}
                                            color={getStatusColor(event.status)}
                                            size="small"
                                        />
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, event)}>
                                            <MoreVert />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {event.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Typography>

                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <People sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.total_bookings || 0} réservations
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.revenue || 0}€
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary">
                                        {event.available_tickets}/{event.total_tickets} billets disponibles
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        navigate(`/events/${selectedEvent?.id}`);
                        handleMenuClose();
                    }}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Voir les détails</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        navigate(`/events/${selectedEvent?.id}/edit`);
                        handleMenuClose();
                    }}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Modifier</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Supprimer</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default Events;
