import React, { useState } from "react";
import { Box, Tabs, Tab, Snackbar, Alert } from "@mui/material";
import { useEmailApi } from "./hooks/useEmailApi";
import EmailLogsTab from "./components/EmailLogsTab";
import TemplatesTab from "./components/TemplatesTab";
import SettingsTab from "./components/SettingsTab";
import TemplateEditor from "./components/TemplateEditor";
import TestEmailDialog from "./components/TestEmailDialog";

const EmailTemplateManager = () => {
    const {
        templates,
        logs,
        settings,
        loading,
        selectedLanguage,
        setSelectedLanguage,
        setSettings,
        fetchTemplates,
        saveTemplate,
        deleteTemplate,
        testTemplate,
    } = useEmailApi();

    const [currentTab, setCurrentTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddTemplate = () => {
        setSelectedTemplate(null);
        setEditorOpen(true);
    };

    const handleEditTemplate = (template) => {
        setSelectedTemplate(template);
        setEditorOpen(true);
    };

    const handleSaveTemplate = async (templateData, isEditing, templateId) => {
        try {
            await saveTemplate(templateData, isEditing, templateId);
            showSnackbar(isEditing ? "Template mis à jour avec succès" : "Template créé avec succès");
            fetchTemplates();
        } catch (error) {
            showSnackbar(error.message, "error");
            throw error;
        }
    };

    const handleDeleteTemplate = async (id) => {
        try {
            await deleteTemplate(id);
            showSnackbar("Template supprimé avec succès");
            fetchTemplates();
        } catch (error) {
            showSnackbar(error.message, "error");
        }
    };

    const handleTestTemplate = (template) => {
        setSelectedTemplate(template);
        setTestDialogOpen(true);
    };

    const handleSendTestEmail = async (templateId, email, variables) => {
        try {
            await testTemplate(templateId, email, variables);
            showSnackbar("Email de test envoyé avec succès");
        } catch (error) {
            showSnackbar(error.message, "error");
            throw error;
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Logs d'emails" />
                <Tab label="Templates" />
                <Tab label="Paramètres" />
            </Tabs>

            {/* Email Logs Tab */}
            {currentTab === 0 && <EmailLogsTab logs={logs} />}

            {/* Templates Tab */}
            {currentTab === 1 && (
                <TemplatesTab
                    templates={templates}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    onRefresh={fetchTemplates}
                    onAddTemplate={handleAddTemplate}
                    onEditTemplate={handleEditTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onTestTemplate={handleTestTemplate}
                />
            )}

            {/* Settings Tab */}
            {currentTab === 2 && <SettingsTab settings={settings} setSettings={setSettings} />}

            {/* Template Editor Dialog */}
            <TemplateEditor
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                template={selectedTemplate}
                selectedLanguage={selectedLanguage}
                templates={templates}
                onSave={handleSaveTemplate}
            />

            {/* Test Email Dialog */}
            <TestEmailDialog
                open={testDialogOpen}
                onClose={() => setTestDialogOpen(false)}
                template={selectedTemplate}
                onSendTest={handleSendTestEmail}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EmailTemplateManager;
