import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    IconButton,
    Alert,
    AlertTitle,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import PushTemplateEditor from './PushTemplateEditor';
import TestPushDialog from './TestPushDialog';

const PushNotificationsTab = ({
    templates,
    loading,
    selectedLanguage,
    setSelectedLanguage,
    saveTemplate,
    deleteTemplate,
    testTemplate,
    fetchTemplates
}) => {
    const [currentSubTab, setCurrentSubTab] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [templateToTest, setTemplateToTest] = useState(null);

    const handleCreateTemplate = () => {
        setSelectedTemplate(null);
        setIsEditorOpen(true);
    };

    const handleEditTemplate = (template) => {
        setSelectedTemplate(template);
        setIsEditorOpen(true);
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
            try {
                await deleteTemplate(templateId);
                await fetchTemplates();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    const handleTestTemplate = (template) => {
        setTemplateToTest(template);
        setIsTestDialogOpen(true);
    };

    const handleSaveTemplate = async (templateData, isEditing) => {
        try {
            await saveTemplate(templateData, isEditing, selectedTemplate?.id);
            setIsEditorOpen(false);
            await fetchTemplates();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const getTemplatesByType = (type) => {
        return templates.filter(template => template.type === type);
    };

    const renderTemplateCard = (template) => (
        <Card key={template.id} sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="div">
                        {template.name}
                    </Typography>
                    <Chip
                        label={template.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                    {template.description}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Titre: {template.title?.[selectedLanguage] || 'Non défini'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    {(template.body?.[selectedLanguage] || 'Non défini').substring(0, 100)}
                    {(template.body?.[selectedLanguage]?.length || 0) > 100 ? '...' : ''}
                </Typography>
            </CardContent>

            <CardActions>
                <IconButton
                    size="small"
                    onClick={() => handleEditTemplate(template)}
                    title="Modifier"
                >
                    <EditIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => handleTestTemplate(template)}
                    title="Tester"
                    color="primary"
                >
                    <SendIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Supprimer"
                    color="error"
                >
                    <DeleteIcon />
                </IconButton>
            </CardActions>
        </Card>
    );

    const renderTemplatesGrid = (templateType, title, description) => {
        const typeTemplates = getTemplatesByType(templateType);

        return (
            <Box>
                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </Box>

                {typeTemplates.length === 0 ? (
                    <Alert severity="info">
                        <AlertTitle>Aucun template trouvé</AlertTitle>
                        Aucun template de notification push de type "{templateType}" n'a été créé.
                    </Alert>
                ) : (
                    <Grid container spacing={3}>
                        {typeTemplates.map((template) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                                {renderTemplateCard(template)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notifications Push
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateTemplate}
                >
                    Nouveau Template
                </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Tabs value={currentSubTab} onChange={(e, newValue) => setCurrentSubTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Rappels d'événements" />
                <Tab label="Confirmations de réservation" />
                <Tab label="Notifications générales" />
                <Tab label="Tous les templates" />
            </Tabs>

            <Box>
                {currentSubTab === 0 && renderTemplatesGrid(
                    'event_reminder',
                    'Rappels d\'événements',
                    'Templates utilisés pour rappeler aux utilisateurs les événements à venir.'
                )}

                {currentSubTab === 1 && renderTemplatesGrid(
                    'booking_confirmation',
                    'Confirmations de réservation',
                    'Templates envoyés lors de la confirmation ou modification d\'une réservation.'
                )}

                {currentSubTab === 2 && renderTemplatesGrid(
                    'general',
                    'Notifications générales',
                    'Templates pour les notifications générales et promotionnelles.'
                )}

                {currentSubTab === 3 && (
                    <Grid container spacing={3}>
                        {templates.map((template) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                                {renderTemplateCard(template)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            <PushTemplateEditor
                open={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                template={selectedTemplate}
                onSave={handleSaveTemplate}
                selectedLanguage={selectedLanguage}
            />

            <TestPushDialog
                open={isTestDialogOpen}
                onClose={() => setIsTestDialogOpen(false)}
                template={templateToTest}
                onTest={testTemplate}
                selectedLanguage={selectedLanguage}
            />
        </Box>
    );
};

export default PushNotificationsTab;
