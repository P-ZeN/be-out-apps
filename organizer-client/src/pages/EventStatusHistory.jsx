import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    ArrowBack,
    CheckCircle,
    Schedule,
    Warning,
    Block,
    Send,
    Undo,
    Edit,
    Publish,
    UnpublishedOutlined,
    Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import organizerService from "../services/organizerService";

const EventStatusHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eventData, historyData] = await Promise.all([
                organizerService.getEvent(id),
                organizerService.getEventStatusHistory(id),
            ]);
            setEvent(eventData);
            setStatusHistory(historyData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status, moderationStatus) => {
        if (moderationStatus === "approved") return <CheckCircle color="success" />;
        if (moderationStatus === "under_review") return <Schedule color="info" />;
        if (moderationStatus === "revision_requested") return <Warning color="warning" />;
        if (moderationStatus === "rejected") return <Block color="error" />;

        switch (status) {
            case "candidate":
                return <Send color="info" />;
            case "draft":
                return <Edit color="action" />;
            case "active":
                return <Publish color="success" />;
            default:
                return <Schedule color="action" />;
        }
    };

    const getStatusColor = (status, moderationStatus) => {
        if (moderationStatus === "approved") return "success";
        if (moderationStatus === "under_review") return "info";
        if (moderationStatus === "revision_requested") return "warning";
        if (moderationStatus === "rejected") return "error";

        switch (status) {
            case "candidate":
                return "info";
            case "draft":
                return "default";
            case "active":
                return "success";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status, moderationStatus) => {
        if (moderationStatus === "approved") return "Approuvé";
        if (moderationStatus === "under_review") return "En révision";
        if (moderationStatus === "revision_requested") return "Révision demandée";
        if (moderationStatus === "rejected") return "Rejeté";

        switch (status) {
            case "candidate":
                return "Soumis pour révision";
            case "draft":
                return "Brouillon";
            case "active":
                return "Actif";
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate("/events")}>
                    Retour aux événements
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate("/events")} sx={{ mb: 2 }}>
                    Retour aux événements
                </Button>

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimelineIcon />
                    Historique des statuts
                </Typography>

                {event && (
                    <Typography variant="h6" color="text.secondary">
                        {event.title}
                    </Typography>
                )}
            </Box>

            {/* Current Status */}
            {event && (
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Statut actuel
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Chip
                                label={getStatusLabel(event.status, event.moderation_status)}
                                color={getStatusColor(event.status, event.moderation_status)}
                                icon={getStatusIcon(event.status, event.moderation_status)}
                            />
                            {event.moderation_status === "approved" && (
                                <Chip
                                    label={event.is_published ? "Publié" : "Non publié"}
                                    color={event.is_published ? "success" : "default"}
                                    variant="outlined"
                                    icon={event.is_published ? <Publish /> : <UnpublishedOutlined />}
                                />
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Status History Timeline */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Historique des changements
                    </Typography>

                    {statusHistory.length === 0 ? (
                        <Alert severity="info">Aucun changement de statut enregistré pour cet événement.</Alert>
                    ) : (
                        <List>
                            {statusHistory.map((change, index) => (
                                <React.Fragment key={change.id}>
                                    <ListItem
                                        sx={{
                                            alignItems: "flex-start",
                                            bgcolor: index === 0 ? "action.hover" : "transparent",
                                            borderRadius: 1,
                                            mb: 1,
                                        }}>
                                        <ListItemIcon sx={{ mt: 1 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    bgcolor: `${getStatusColor(
                                                        change.new_status,
                                                        change.new_moderation_status
                                                    )}.main`,
                                                    color: "white",
                                                }}>
                                                {getStatusIcon(change.new_status, change.new_moderation_status)}
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        mb: 1,
                                                    }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {getStatusLabel(
                                                            change.new_status,
                                                            change.new_moderation_status
                                                        )}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(change.created_at)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {change.change_reason && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 1 }}>
                                                            {change.change_reason}
                                                        </Typography>
                                                    )}

                                                    {change.admin_notes && (
                                                        <Paper
                                                            variant="outlined"
                                                            sx={{ p: 2, mt: 1, bgcolor: "background.default" }}>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                color="primary"
                                                                sx={{ mb: 0.5 }}>
                                                                Notes de l'administrateur :
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {change.admin_notes}
                                                            </Typography>
                                                        </Paper>
                                                    )}

                                                    {change.changed_by_email && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ display: "block", mt: 1 }}>
                                                            Modifié par : {change.changed_by_email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < statusHistory.length - 1 && (
                                        <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 2,
                                                    height: 20,
                                                    bgcolor: "divider",
                                                }}
                                            />
                                        </Box>
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default EventStatusHistory;
