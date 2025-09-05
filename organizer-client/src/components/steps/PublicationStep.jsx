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
                                    {t('organizer:publication.status.current')}
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                                    {/* Approval Status */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 'medium', minWidth: '140px' }}>
                                            {t('organizer:publication.status.approval')}
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
                                            {t('organizer:publication.status.general')}
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

                                    {/* Publish/Unpublish */}
                                    {canPublishUnpublish && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {adminData?.is_published ? t('organizer:publication.actions.unpublish') : t('organizer:publication.actions.publish')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {adminData?.is_published
                                                            ? t('organizer:publication.actions.unpublishDescription')
                                                            : t('organizer:publication.actions.publishDescription')
                                                        }
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant={adminData?.is_published ? "outlined" : "contained"}
                                                    startIcon={<PublishIcon />}
                                                    onClick={adminData?.is_published ? onUnpublish : onPublish}
                                                    color={adminData?.is_published ? "default" : "success"}
                                                >
                                                    {adminData?.is_published ? t('organizer:publication.actions.unpublishBtn') : t('organizer:publication.actions.publishBtn')}
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

                {/* Publication Options */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('organizer:publication.options.title')}
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
                                            {t('organizer:publication.actions.submitReview')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {data.request_review
                                                ? t('organizer:publication.options.submitAfterCreation')
                                                : t('organizer:publication.options.stayDraftAfterCreation')
                                            }
                                        </Typography>
                                    </Box>
                                }
                            />

                            {data.request_review && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        {t('organizer:publication.options.reviewTime')}
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
                                                {t('organizer:publication.actions.submitReview')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {data.request_review
                                                    ? t('organizer:publication.options.submitForReviewShort')
                                                    : t('organizer:publication.options.stayDraftShort')
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {data.request_review && (
                                    <Alert severity="info" sx={{ mt: 1, p: 1 }}>
                                        <Typography variant="caption">
                                            {t('organizer:publication.options.reviewSoon')}
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
                                {t('organizer:publication.process.title')}
                            </Typography>

                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="1" size="small" color="primary" />
                                    <Typography variant="body2">
                                        <strong>{t('organizer:publication.process.draft')}:</strong> {t('organizer:publication.process.draftDescription')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="2" size="small" color="info" />
                                    <Typography variant="body2">
                                        <strong>{t('organizer:publication.process.review')}:</strong> {t('organizer:publication.process.reviewDescription')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="3" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>{t('organizer:publication.process.approved')}:</strong> {t('organizer:publication.process.approvedDescription')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="4" size="small" color="success" />
                                    <Typography variant="body2">
                                        <strong>{t('organizer:publication.process.published')}:</strong> {t('organizer:publication.process.publishedDescription')}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('organizer:publication.process.note')}:</strong> {t('organizer:publication.process.noteDescription')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Final Actions */}
                <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                        <Typography variant="body2">
                            {isEdit
                                ? t('organizer:publication.messages.saveChanges')
                                : t('organizer:publication.messages.createEvent')
                            }
                        </Typography>

                        {data.request_review && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {t('organizer:publication.messages.notifyAdmin')}
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
                                ? t('organizer:publication.messages.saving')
                                : data.request_review
                                    ? t('organizer:publication.messages.finalizeSubmit')
                                    : isEdit
                                        ? t('organizer:publication.messages.saveChangesBtn')
                                        : t('organizer:publication.messages.createEventBtn')
                            }
                        </Button>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {t('organizer:publication.messages.useNavigation')}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PublicationStep;
