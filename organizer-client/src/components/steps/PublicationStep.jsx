import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    FormControlLabel,
    Switch,
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
    CircularProgress,
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
    HourglassEmpty as HourglassEmptyIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Publish as PublishIcon,
    Undo as UndoIcon,
    History as HistoryIcon,
    Block as BlockIcon,
    Error as ErrorIcon,
} from "@mui/icons-material";

const PublicationStep = ({ data, onChange, adminData, isEdit, loading, onSubmitForReview, onPublish, onUnpublish, onRevert }) => {
    const { t } = useTranslation();
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

    // Status checking functions
    const canPublish = adminData?.moderation_status === 'approved';
    const canSubmitForReview = adminData?.status === 'draft' && adminData?.moderation_status !== 'under_review';
    const canRevertToDraft = adminData?.status === 'candidate' && adminData?.moderation_status === 'under_review';
    const canPublishUnpublish = adminData?.moderation_status === 'approved';

    const needsReview = adminData?.moderation_status !== 'approved';
    const isUnderReview = adminData?.moderation_status === 'under_review';
    const isRejected = adminData?.moderation_status === 'rejected';
    const isCandidate = adminData?.status === 'candidate';
    const isDraft = adminData?.status === 'draft';

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
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'under_review': return 'info';
            case 'revision_requested': return 'warning';
            case 'flagged': return 'error';
            case 'pending': return 'default';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return t('Approuvé');
            case 'rejected': return t('Rejeté');
            case 'under_review': return t('En cours de révision');
            case 'revision_requested': return t('Révision demandée');
            case 'flagged': return t('Signalé');
            case 'pending': return t('En attente de révision');
            default: return t('Statut inconnu');
        }
    };

    const getEventStatusLabel = (status, moderationStatus, isPublished) => {
        // Priority: moderation status overrides regular status for display
        if (moderationStatus === 'rejected') {
            return t('Rejeté');
        }
        if (moderationStatus === 'revision_requested') {
            return t('Révision demandée');
        }
        if (moderationStatus === 'under_review') {
            return t('En cours de révision');
        }
        if (moderationStatus === 'flagged') {
            return t('Signalé');
        }

        switch (status) {
            case 'active':
                return isPublished ? t('Publié') : t('Approuvé (non publié)');
            case 'draft':
                return t('Brouillon');
            case 'candidate':
                return t('En attente de validation');
            case 'cancelled':
                return t('Annulé');
            case 'suspended':
                return t('Suspendu');
            case 'completed':
                return t('Terminé');
            default:
                return t('Statut inconnu');
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
                {t('Publication et modération')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('Gérez la publication de votre événement et suivez son statut de modération.')}
            </Typography>

            <Grid container spacing={3}>
                {/* Event Summary */}
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('Récapitulatif de l\'événement')}
                            </Typography>

                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        <EventIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('Détails de l\'événement')}
                                        secondary={`✅ ${t('Titre, description et détails configurés')}`}
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <PlaceIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('Lieu')}
                                        secondary={`✅ ${t('Lieu sélectionné et configuré')}`}
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <TicketIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('Billetterie')}
                                        secondary={`✅ ${t('Configuration des billets terminée')}`}
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
                                    {t('Statut actuel de l\'événement')}
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                                    {/* Approval Status */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 'medium', minWidth: '140px' }}>
                                            {t('Statut d\'approbation:')}
                                        </Typography>
                                        <Chip
                                            icon={getStatusIcon(adminData.moderation_status)}
                                            label={getStatusText(adminData.moderation_status)}
                                            color={getStatusColor(adminData.moderation_status)}
                                            size="medium"
                                        />
                                    </Box>

                                    {/* General Status */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 'medium', minWidth: '140px' }}>
                                            {t('Statut général:')}
                                        </Typography>
                                        <Chip
                                            label={getEventStatusLabel(adminData.status, adminData.moderation_status, adminData.is_published)}
                                            color={
                                                adminData.moderation_status === 'approved' && adminData.is_published
                                                    ? 'success'
                                                    : adminData.moderation_status === 'rejected' || adminData.moderation_status === 'flagged'
                                                    ? 'error'
                                                    : adminData.moderation_status === 'revision_requested'
                                                    ? 'warning'
                                                    : 'info'
                                            }
                                            size="medium"
                                        />
                                    </Box>

                                    {/* Status explanation */}
                                    <Alert
                                        severity={
                                            adminData.moderation_status === 'approved' && adminData.is_published
                                                ? 'success'
                                                : adminData.moderation_status === 'rejected' || adminData.moderation_status === 'flagged'
                                                ? 'error'
                                                : adminData.moderation_status === 'revision_requested'
                                                ? 'warning'
                                                : 'info'
                                        }
                                    >
                                        {getStatusTooltip(adminData.status, adminData.moderation_status, adminData.is_published)}
                                    </Alert>
                                </Box>

                                {/* Admin Comments */}
                                <Box sx={{ mt: 2 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {t('Commentaires de l\'administrateur:')}
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
                                            {t('Aucun commentaire de l\'administrateur')}
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
                                    {t('Actions disponibles')}
                                </Typography>

                                <Stack spacing={2}>
                                    {/* Submit for Review */}
                                    {canSubmitForReview && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('Soumettre pour révision')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('Envoyez votre événement à l\'équipe de modération pour approbation')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<SendIcon />}
                                                    onClick={onSubmitForReview}
                                                    color="primary"
                                                >
                                                    {t('Soumettre')}
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
                                                        {t('Remettre en brouillon')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('Retirez votre événement de la révision pour le modifier')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<UndoIcon />}
                                                    onClick={onRevert}
                                                >
                                                    {t('Remettre en brouillon')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Publish/Unpublish */}
                                    {canPublishUnpublish && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {adminData?.is_published ? t('Dépublier l\'événement') : t('Publier l\'événement')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {adminData?.is_published
                                                            ? t('Masquez votre événement du public temporairement')
                                                            : t('Rendez votre événement visible au public')
                                                        }
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant={adminData?.is_published ? "outlined" : "contained"}
                                                    startIcon={<PublishIcon />}
                                                    onClick={adminData?.is_published ? onUnpublish : onPublish}
                                                    color={adminData?.is_published ? "default" : "success"}
                                                >
                                                    {adminData?.is_published ? t('Dépublier') : t('Publier')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* View Public Page */}
                                    {adminData?.is_published && adminData?.moderation_status === 'approved' && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {t('Voir la page publique')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('Consultez votre événement tel qu\'il apparaît aux visiteurs')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={handleViewPublicPage}
                                                >
                                                    {t('Voir la page')}
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
                                                        {t('Historique des statuts')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('Consultez l\'historique complet des modifications de statut')}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<HistoryIcon />}
                                                    onClick={handleViewStatusHistory}
                                                >
                                                    {t('Voir l\'historique')}
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Publication Options */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('Options de publication')}
                    </Typography>

                    {/* Publication Settings for new events or specific cases */}
                    {!isEdit && (
                        <Box sx={{ mb: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.request_review || false}
                                        onChange={(e) => handleChange('request_review', e.target.checked)}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {t('Soumettre pour révision')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {data.request_review
                                                ? t('Sera soumis à la révision après création')
                                                : t('Rester en brouillon après création')
                                            }
                                        </Typography>
                                    </Box>
                                }
                            />

                            {data.request_review && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        {t('Votre événement sera examiné par notre équipe dans un délai de 24-48 heures')}
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}

                    {/* Request Review Switch - only for non-approved events when editing */}
                    {isEdit &&
                        adminData?.moderation_status !== "approved" &&
                        adminData?.moderation_status !== "under_review" && (
                            <Box sx={{ mb: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={data.request_review || false}
                                            onChange={(e) => handleChange('request_review', e.target.checked)}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {t('Soumettre pour révision')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {data.request_review
                                                    ? t('Sera soumis à la révision')
                                                    : t('Rester en brouillon')
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {data.request_review && (
                                    <Alert severity="info" sx={{ mt: 1, p: 1 }}>
                                        <Typography variant="caption">
                                            {t('Votre événement sera examiné bientôt')}
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        )}
                </Grid>

                {/* Help Information */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('Processus de modération')}
                            </Typography>

                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="1" size="small" color="primary" />
                                    <Typography variant="body2">
                                        <strong>{t('Brouillon:')}</strong> {t('Votre événement est en cours de création, vous pouvez le modifier librement')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="2" size="small" color="info" />
                                    <Typography variant="body2">
                                        <strong>{t('En révision:')}</strong> {t('Notre équipe examine votre événement (24-48h)')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="3" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>{t('Approuvé:')}</strong> {t('Vous pouvez maintenant publier votre événement')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="4" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>{t('Publié:')}</strong> {t('Votre événement est visible par le public et les réservations sont ouvertes')}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('Note:')}</strong> {t('Vous pouvez modifier un événement en brouillon ou si l\'administrateur demande des révisions. Une fois approuvé et publié, les modifications majeures nécessiteront une nouvelle révision.')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Final Actions */}
                <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                        <Typography variant="body2">
                            {isEdit
                                ? t('Les modifications seront sauvegardées lors de la finalisation.')
                                : t('L\'événement sera créé lors de la finalisation.')
                            }
                        </Typography>

                        {data.request_review && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {t('Une notification sera envoyée aux administrateurs pour la révision.')}
                            </Typography>
                        )}
                    </Alert>
                </Grid>

                {/* Complete Button Preview */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ textAlign: 'center', pt: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : (data.request_review ? <SendIcon /> : <CheckCircleIcon />)}
                            disabled
                            sx={{ minWidth: 200 }}
                        >
                            {loading
                                ? t('Sauvegarde en cours...')
                                : data.request_review
                                    ? t('Finaliser et soumettre')
                                    : isEdit
                                        ? t('Sauvegarder les modifications')
                                        : t('Créer l\'événement')
                            }
                        </Button>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {t('Utilisez les boutons de navigation pour finaliser')}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PublicationStep;
