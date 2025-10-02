import React, { useState } from "react";
import { Box, Tabs, Tab, Snackbar, Alert, Chip } from "@mui/material";
import { Email, Notifications, Analytics, Settings as SettingsIcon } from "@mui/icons-material";
import { useEmailApi } from "./hooks/useEmailApi";
import { usePushNotificationApi } from "./hooks/usePushNotificationApi";
import EmailLogsTab from "./components/EmailLogsTab";
import TemplatesTab from "./components/TemplatesTab";
import PushNotificationsTab from "./PushNotificationsTab";
import SettingsTab from "./components/SettingsTab";
import PushNotificationSettings from "./components/PushNotificationSettings";
import TemplateEditor from "./components/TemplateEditor";
import PushTemplateEditor from "./PushTemplateEditor";
import TestEmailDialog from "./components/TestEmailDialog";
import TestPushDialog from "./components/TestPushDialog";

const CommunicationsManager = () => {
    // Email API hooks
    const {
        templates: emailTemplates,
        logs: emailLogs,
        settings: emailSettings,
        loading: emailLoading,
        selectedLanguage: emailLanguage,
        setSelectedLanguage: setEmailLanguage,
        setSettings: setEmailSettings,
        fetchTemplates: fetchEmailTemplates,
        saveTemplate: saveEmailTemplate,
        deleteTemplate: deleteEmailTemplate,
        testTemplate: testEmailTemplate,
    } = useEmailApi();

    // Push notification API hooks
    const {
        templates: pushTemplates,
        logs: pushLogs,
        settings: pushSettings,
        loading: pushLoading,
        selectedLanguage: pushLanguage,
        setSelectedLanguage: setPushLanguage,
        fetchTemplates: fetchPushTemplates,
        saveTemplate: savePushTemplate,
        deleteTemplate: deletePushTemplate,
        testTemplate: testPushTemplate,
    } = usePushNotificationApi();

    const [currentTab, setCurrentTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateType, setTemplateType] = useState('email'); // 'email' or 'push'
    const [editorOpen, setEditorOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddTemplate = (type = 'email') => {
        setSelectedTemplate(null);
        setTemplateType(type);
        setEditorOpen(true);
    };

    const handleEditTemplate = (template, type = 'email') => {
        setSelectedTemplate(template);
        setTemplateType(type);
        setEditorOpen(true);
    };

    const handleSaveTemplate = async (templateData, isEditing, templateId) => {
        try {
            if (templateType === 'email') {
                await saveEmailTemplate(templateData, isEditing, templateId);
                fetchEmailTemplates();
            } else {
                await savePushTemplate(templateData, isEditing, templateId);
                fetchPushTemplates();
            }

            showSnackbar(
                isEditing
                    ? `${templateType === 'email' ? 'Email' : 'Notification'} template mis à jour avec succès`
                    : `${templateType === 'email' ? 'Email' : 'Notification'} template créé avec succès`
            );
            setEditorOpen(false);
        } catch (error) {
            console.error('Error saving template:', error);
            showSnackbar("Erreur lors de la sauvegarde du template", "error");
        }
    };

    const handleDeleteTemplate = async (templateId, type = 'email') => {
        try {
            if (type === 'email') {
                await deleteEmailTemplate(templateId);
                fetchEmailTemplates();
            } else {
                await deletePushTemplate(templateId);
                fetchPushTemplates();
            }
            showSnackbar(`${type === 'email' ? 'Email' : 'Notification'} template supprimé avec succès`);
        } catch (error) {
            console.error('Error deleting template:', error);
            showSnackbar("Erreur lors de la suppression du template", "error");
        }
    };

    const handleTestTemplate = (template, type = 'email') => {
        setSelectedTemplate(template);
        setTemplateType(type);
        setTestDialogOpen(true);
    };

    const handleSendTest = async (testData) => {
        try {
            if (templateType === 'email') {
                await testEmailTemplate(selectedTemplate.key, testData);
            } else {
                await testPushTemplate(selectedTemplate.key, testData);
            }
            showSnackbar(`Test ${templateType === 'email' ? 'email' : 'notification'} envoyé avec succès`);
            setTestDialogOpen(false);
        } catch (error) {
            console.error('Error sending test:', error);
            showSnackbar("Erreur lors de l'envoi du test", "error");
        }
    };

    const tabs = [
        {
            label: "E-mails",
            icon: <Email />,
            badge: emailTemplates?.length || 0
        },
        {
            label: "Notifications Push",
            icon: <Notifications />,
            badge: pushTemplates?.length || 0
        },
        {
            label: "Statistiques",
            icon: <Analytics />,
            badge: null
        },
        {
            label: "Paramètres",
            icon: <SettingsIcon />,
            badge: null
        }
    ];

    const renderTabContent = () => {
        switch (currentTab) {
            case 0: // Email Templates
                return (
                    <TemplatesTab
                        templates={emailTemplates}
                        loading={emailLoading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedLanguage={emailLanguage}
                        setSelectedLanguage={setEmailLanguage}
                        onAddTemplate={() => handleAddTemplate('email')}
                        onEditTemplate={(template) => handleEditTemplate(template, 'email')}
                        onDeleteTemplate={(id) => handleDeleteTemplate(id, 'email')}
                        onTestTemplate={(template) => handleTestTemplate(template, 'email')}
                        templateType="email"
                    />
                );

            case 1: // Push Notifications
                return (
                    <PushNotificationsTab
                        templates={pushTemplates}
                        loading={pushLoading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedLanguage={pushLanguage}
                        setSelectedLanguage={setPushLanguage}
                        onAddTemplate={() => handleAddTemplate('push')}
                        onEditTemplate={(template) => handleEditTemplate(template, 'push')}
                        onDeleteTemplate={(id) => handleDeleteTemplate(id, 'push')}
                        onTestTemplate={(template) => handleTestTemplate(template, 'push')}
                        templateType="push"
                    />
                );

            case 2: // Analytics
                return (
                    <Box sx={{ p: 3 }}>
                        <EmailLogsTab
                            logs={[...emailLogs, ...pushLogs]}
                            loading={emailLoading || pushLoading}
                        />
                    </Box>
                );

            case 3: // Settings
                return (
                    <Box>
                        {/* Email Settings */}
                        <SettingsTab
                            settings={emailSettings}
                            loading={emailLoading}
                            onSave={(newSettings) => {
                                setEmailSettings(newSettings);
                                showSnackbar("Paramètres email sauvegardés avec succès");
                            }}
                        />

                        {/* Push Notification Settings */}
                        <PushNotificationSettings
                            settings={pushSettings}
                            loading={pushLoading}
                            onSave={(newSettings) => {
                                // Push settings are environment-based for now
                                showSnackbar("Paramètres push consultés");
                            }}
                        />
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            {/* Header Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            icon={tab.icon}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {tab.label}
                                    {tab.badge !== null && (
                                        <Chip
                                            label={tab.badge}
                                            size="small"
                                            color="primary"
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                    )}
                                </Box>
                            }
                            iconPosition="start"
                            sx={{ minHeight: 72 }}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flexGrow: 1 }}>
                {renderTabContent()}
            </Box>

            {/* Template Editors */}
            {templateType === 'email' ? (
                <TemplateEditor
                    open={editorOpen}
                    template={selectedTemplate}
                    onClose={() => setEditorOpen(false)}
                    onSave={handleSaveTemplate}
                    selectedLanguage={emailLanguage}
                />
            ) : (
                <PushTemplateEditor
                    open={editorOpen}
                    template={selectedTemplate}
                    onClose={() => setEditorOpen(false)}
                    onSave={handleSaveTemplate}
                    selectedLanguage={pushLanguage}
                />
            )}

            {/* Test Dialogs */}
            {templateType === 'email' ? (
                <TestEmailDialog
                    open={testDialogOpen}
                    template={selectedTemplate}
                    onClose={() => setTestDialogOpen(false)}
                    onSend={handleSendTest}
                />
            ) : (
                <TestPushDialog
                    open={testDialogOpen}
                    template={selectedTemplate}
                    onClose={() => setTestDialogOpen(false)}
                    onSend={handleSendTest}
                />
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CommunicationsManager;
