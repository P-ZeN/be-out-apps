import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Alert,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Button,
    Paper,
    Divider,
    Stack,
} from "@mui/material";
import {
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Event as EventIcon,
    Place as PlaceIcon,
    ConfirmationNumber as TicketIcon,
    Visibility as VisibilityIcon,
    Send as SendIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
    Publish as PublishIcon,
    Undo as UndoIcon,
    History as HistoryIcon,
    Block as BlockIcon,
    Error as ErrorIcon,
} from "@mui/icons-material";

const PublicationStep = ({ data, onChange, adminData, isEdit, loading, onSubmitForReview, onTogglePublication, onRevert }) => {
    const { t } = useTranslation('organizer');
    const navigate = useNavigate();

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const handleViewStatusHistory = () => {
        if (adminData?.id) {
            navigate(`/events/${adminData.id}/status-history`);
        }
    };

    const handleViewPublicPage = () => {
        if (adminData?.id && adminData?.is_published && adminData?.moderation_status === 'approved') {
            const clientUrl = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';
            window.open(`${clientUrl}/events/${adminData.id}`, '_blank');
        }
    };

    // Clearer separation of concerns (backward compatible)
    const organizerWantsPublished = adminData?.organizer_wants_published !== undefined 
        ? adminData.organizer_wants_published 
        : adminData?.is_published || false; // Fallback for existing data
    const adminApproved = adminData?.moderation_status === 'approved';
    const eventVisibleToPublic = organizerWantsPublished && adminApproved;
    
    // Simplified status checks
    const canSubmitForReview = adminData?.status === 'draft' || 
                              adminData?.moderation_status === 'rejected' || 
                              adminData?.moderation_status === 'revision_requested' || 
                              adminData?.moderation_status === 'flagged';
    const canRevertToDraft = adminData?.status === 'candidate' && adminData?.moderation_status === 'under_review';
    const canTogglePublication = adminApproved; // Only toggle if admin approved

    const needsReview = !adminApproved;
    const isUnderReview = adminData?.moderation_status === 'under_review';
    const isRejected = adminData?.moderation_status === 'rejected';
    const isRevisionRequested = adminData?.moderation_status === 'revision_requested';
    const isFlagged = adminData?.moderation_status === 'flagged';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircleIcon />;
            case 'rejected': return <ErrorIcon />;
            case 'under_review': return <ScheduleIcon />;
            case 'revision_requested': return <WarningIcon />;
            case 'flagged': return <BlockIcon />;
            case 'pending': return <HourglassEmptyIcon />;
            default: return <InfoIcon />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': 
                return 'success'; // Green for approved
            case 'rejected': 
                return 'error'; // Red for rejected
            case 'under_review': 
                return 'info'; // Blue for under review
            case 'revision_requested': 
                return 'warning'; // Orange for revision requested
            case 'flagged': 
                return 'error'; // Red for flagged
            case 'pending': 
                return 'default'; // Gray for pending
            default: 
                return 'default'; // Gray as fallback
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return t('organizer:publication.status.approved');
            case 'rejected': return t('organizer:publication.status.rejected');
            case 'under_review': return t('organizer:publication.status.underReview');
            case 'revision_requested': return t('organizer:publication.status.revisionRequested');
            case 'flagged': return t('organizer:publication.status.flagged');
            case 'pending': return t('organizer:publication.status.pending');
            default: return t('organizer:publication.status.unknown');
        }
    };

    const getEventStatusLabel = (status, moderationStatus, isPublished) => {
        // Priority: moderation status overrides regular status for display
        if (moderationStatus === 'rejected') {
            return t('organizer:publication.status.rejected');
        }
        if (moderationStatus === 'revision_requested') {
            return t('organizer:publication.status.revisionRequested');
        }
        if (moderationStatus === 'under_review') {
            return t('organizer:publication.status.underReview');
        }
        if (moderationStatus === 'flagged') {
            return t('organizer:publication.status.flagged');
        }

        switch (status) {
            case 'active':
                return isPublished ? t('organizer:publication.status.published') : t('organizer:publication.status.approvedNotPublished');
            case 'draft':
                return t('organizer:publication.status.draft');
            case 'candidate':
                return t('organizer:publication.status.pendingValidation');
            case 'cancelled':
                return t('organizer:publication.status.cancelled');
            case 'suspended':
                return t('organizer:publication.status.suspended');
            case 'completed':
                return t('organizer:publication.status.finished');
            default:
                return t('organizer:publication.status.unknown');
        }
    };

    const getStatusTooltip = (status, moderationStatus, isPublished) => {
        if (moderationStatus === 'rejected') {
            return 'Votre événement a été rejeté. Consultez les commentaires et modifiez-le.';
        }
        if (moderationStatus === 'revision_requested') {
            return 'Des modifications sont requises. Consultez les commentaires de l\'administrateur.';
        }
        if (moderationStatus === 'under_review') {
            return 'Votre événement est en cours de révision par notre équipe.';
        }
        if (moderationStatus === 'approved' && status === 'active') {
            return isPublished
                ? 'Votre événement est publié et visible par le public.'
                : 'Votre événement est approuvé mais pas encore publié.';
        }
        if (status === 'draft') {
            return 'Votre événement est en brouillon. Soumettez-le pour révision quand il est prêt.';
        }
        if (status === 'candidate') {
            return 'Votre événement attend la validation de notre équipe.';
        }
        return '';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {t('organizer:publication.title')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('organizer:publication.description')}
            </Typography>

            <Grid container spacing={3}>
                {/* Event Summary */}
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('organizer:publication.summary.title')}
                            </Typography>

                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        <EventIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('organizer:publication.summary.details')}
                                        secondary={`✅ ${t('organizer:publication.summary.detailsComplete')}`}
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <PlaceIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('organizer:publication.summary.venue')}
                                        secondary={`✅ ${t('organizer:publication.summary.venueComplete')}`}
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <TicketIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('organizer:publication.summary.ticketing')}
                                        secondary={`✅ ${t('organizer:publication.summary.ticketingComplete')}`}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Current Status Card - Only show if editing existing event */}
                {isEdit && adminData && (
                    <Grid size={{ xs: 12 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Status de publication
                                </Typography>

                                <Stack spacing={3}>
                                    {/* Admin Approval Status */}
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                            🛡️ Statut d'approbation admin
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Chip
                                                icon={getStatusIcon(adminData.moderation_status)}
                                                label={getStatusText(adminData.moderation_status)}
                                                color={getStatusColor(adminData.moderation_status)}
                                                size="medium"
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {adminApproved 
                                                    ? "Votre événement est approuvé par l'équipe" 
                                                    : "En attente d'approbation par l'équipe"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Organizer Publication Intent */}
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                            📢 Votre intention de publication
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Chip
                                                icon={organizerWantsPublished ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={organizerWantsPublished ? "Publier l'événement" : "Garder privé"}
                                                color={organizerWantsPublished ? "info" : "default"}
                                                size="medium"
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {organizerWantsPublished 
                                                    ? "Vous souhaitez que cet événement soit visible" 
                                                    : "Vous gardez cet événement privé"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Final Result */}
                                    <Box sx={{ p: 2, bgcolor: eventVisibleToPublic ? 'success.light' : 'grey.100', borderRadius: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                            🌐 Résultat final
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Chip
                                                icon={eventVisibleToPublic ? <VisibilityIcon /> : <VisibilityIcon sx={{ opacity: 0.5 }} />}
                                                label={eventVisibleToPublic ? "Visible sur le site" : "Non visible sur le site"}
                                                color={eventVisibleToPublic ? "success" : "default"}
                                                size="medium"
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {eventVisibleToPublic 
                                                    ? "✅ Les visiteurs peuvent voir et réserver cet événement"
                                                    : "❌ Cet événement n'apparaît pas sur le site public"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>

                                {/* Admin Comments */}
                                <Box sx={{ mt: 2 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {t('organizer:publication.admin.comments')}
                                    </Typography>
                                    {adminData.admin_notes ? (
                                        <Alert
                                            severity={
                                                adminData.moderation_status === 'rejected' || adminData.moderation_status === 'flagged'
                                                    ? 'error'
                                                    : adminData.moderation_status === 'revision_requested'
                                                    ? 'warning'
                                                    : 'info'
                                            }
                                        >
                                            <Typography variant="body2">
                                                {adminData.admin_notes}
                                            </Typography>
                                        </Alert>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontStyle: 'italic' }}
                                        >
                                            {t('organizer:publication.admin.noComments')}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Actions Card - Only show if editing existing event */}
                {isEdit && adminData && (
                    <Grid size={{ xs: 12 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {t('organizer:publication.actions.title')}
                                </Typography>

                                <Stack spacing={2}>
                                    {/* Submit for Review */}
                                    {canSubmitForReview && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('organizer:publication.actions.submitReview')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('organizer:publication.actions.submitDescription')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<SendIcon />}
                                                    onClick={onSubmitForReview}
                                                    color="primary"
                                                >
                                                    {t('organizer:publication.actions.submit')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Revert to Draft */}
                                    {canRevertToDraft && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('organizer:publication.actions.revertDraft')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('organizer:publication.actions.revertDescription')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<UndoIcon />}
                                                    onClick={onRevert}
                                                >
                                                    {t('organizer:publication.actions.revertDraft')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Toggle Publication Intent */}
                                    {canTogglePublication && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {organizerWantsPublished ? "Retirer de la publication" : "Publier l'événement"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {organizerWantsPublished
                                                            ? "Garder l'événement privé même s'il est approuvé"
                                                            : "Rendre l'événement visible une fois approuvé"
                                                        }
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant={organizerWantsPublished ? "outlined" : "contained"}
                                                    startIcon={<PublishIcon />}
                                                    onClick={onTogglePublication}
                                                    color={organizerWantsPublished ? "default" : "success"}
                                                >
                                                    {organizerWantsPublished ? "Retirer" : "Publier"}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* View Public Page */}
                                    {eventVisibleToPublic && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('organizer:publication.actions.viewPublic')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('organizer:publication.actions.viewPublicDescription')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={handleViewPublicPage}
                                                >
                                                    {t('organizer:publication.actions.viewPage')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* View Status History */}
                                    {adminData?.id && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('organizer:publication.actions.statusHistory')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('organizer:publication.actions.statusHistoryDescription')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<HistoryIcon />}
                                                    onClick={handleViewStatusHistory}
                                                >
                                                    {t('organizer:publication.actions.viewHistory')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Help Information */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Processus de publication
                            </Typography>

                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="1" size="small" color="default" />
                                    <Typography variant="body2">
                                        <strong>Créer :</strong> Créez votre événement en brouillon
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="2" size="small" color="info" />
                                    <Typography variant="body2">
                                        <strong>Soumettre :</strong> Envoyez votre événement pour approbation admin
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="3" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>Approuvé :</strong> L'équipe valide la qualité de votre événement
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="4" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>Publier :</strong> Vous choisissez de rendre l'événement visible
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>📋 Contrôles séparés :</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    • <strong>Admin :</strong> Vérifie la qualité et conformité (approbation)<br/>
                                    • <strong>Vous :</strong> Décidez si vous voulez publier (intention)<br/>
                                    • <strong>Résultat :</strong> Visible uniquement si les deux sont vrais
                                </Typography>
                            </Alert>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Navigation Help */}
                {!isEdit && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info">
                            <Typography variant="body2">
                                💡 <strong>Création d'événement :</strong> Complétez toutes les étapes, puis votre événement sera créé en brouillon. Vous pourrez ensuite le soumettre pour révision.
                            </Typography>
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default PublicationStep;
