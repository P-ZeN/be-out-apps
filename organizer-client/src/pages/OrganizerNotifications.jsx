import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Badge,
    Chip,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Menu,
    MenuItem,
    Tooltip,
} from "@mui/material";
import {
    Notifications,
    NotificationsActive,
    CheckCircle,
    Schedule,
    Warning,
    Block,
    Event,
    MoreVert,
    MarkEmailRead,
    ClearAll,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import organizerService from "../services/organizerService";

const OrganizerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await organizerService.getNotifications({ limit: 50 });
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await organizerService.markNotificationAsRead(notificationId);
            await loadNotifications(); // Reload to update counts
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await organizerService.markAllNotificationsAsRead();
            await loadNotifications(); // Reload to update counts
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMenuOpen = (event, notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "event_approval":
                return <CheckCircle color="success" />;
            case "event_status":
                return <Event color="primary" />;
            case "system":
                return <NotificationsActive color="info" />;
            default:
                return <Notifications />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "error";
            case "high":
                return "warning";
            case "normal":
                return "primary";
            case "low":
                return "default";
            default:
                return "default";
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return "À l'instant";
        } else if (diffInHours < 24) {
            return `Il y a ${Math.floor(diffInHours)}h`;
        } else if (diffInHours < 48) {
            return "Hier";
        } else {
            return date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }

        // Navigate to relevant page if there's event data
        if (notification.data && notification.data.event_id) {
            if (notification.type === "event_approval" || notification.type === "event_status") {
                navigate(`/events/${notification.data.event_id}/status-history`);
            } else {
                navigate(`/events/${notification.data.event_id}`);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Notifications
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Suivez les mises à jour de vos événements
                    </Typography>
                </Box>

                {unreadCount > 0 && (
                    <Button variant="outlined" startIcon={<ClearAll />} onClick={handleMarkAllAsRead}>
                        Marquer tout comme lu ({unreadCount})
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                        <Notifications sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Aucune notification
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vous recevrez ici les notifications concernant vos événements
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <List>
                        {notifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                                <ListItem
                                    sx={{
                                        bgcolor: notification.is_read ? "transparent" : "action.hover",
                                        cursor: "pointer",
                                        "&:hover": {
                                            bgcolor: notification.is_read ? "action.hover" : "action.selected",
                                        },
                                    }}
                                    onClick={() => handleNotificationClick(notification)}>
                                    <ListItemIcon>
                                        <Badge variant="dot" color="error" invisible={notification.is_read}>
                                            {getNotificationIcon(notification.type)}
                                        </Badge>
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: notification.is_read ? "normal" : "bold",
                                                        flex: 1,
                                                    }}>
                                                    {notification.title}
                                                </Typography>
                                                {notification.priority !== "normal" && (
                                                    <Chip
                                                        label={notification.priority}
                                                        size="small"
                                                        color={getPriorityColor(notification.priority)}
                                                        variant="outlined"
                                                    />
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(notification.created_at)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 0.5,
                                                    fontWeight: notification.is_read ? "normal" : 500,
                                                }}>
                                                {notification.message}
                                            </Typography>
                                        }
                                    />

                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMenuOpen(e, notification);
                                        }}>
                                        <MoreVert />
                                    </IconButton>
                                </ListItem>

                                {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Card>
            )}

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {selectedNotification && !selectedNotification.is_read && (
                    <MenuItem
                        onClick={() => {
                            handleMarkAsRead(selectedNotification.id);
                            handleMenuClose();
                        }}>
                        <ListItemIcon>
                            <MarkEmailRead fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Marquer comme lu</ListItemText>
                    </MenuItem>
                )}

                {selectedNotification && selectedNotification.data && selectedNotification.data.event_id && (
                    <MenuItem
                        onClick={() => {
                            navigate(`/events/${selectedNotification.data.event_id}`);
                            handleMenuClose();
                        }}>
                        <ListItemIcon>
                            <Event fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Voir l'événement</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};

export default OrganizerNotifications;
