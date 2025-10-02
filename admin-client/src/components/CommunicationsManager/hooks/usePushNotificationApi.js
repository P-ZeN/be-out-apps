import { useState, useEffect } from "react";
import AdminService from "../../../services/adminService";

export const usePushNotificationApi = () => {
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("fr");

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            // For now, load templates from the file system via admin API
            // In future, this could be moved to database storage
            const response = await AdminService.request("/api/admin/push-templates", "GET");
            setTemplates(response.templates || []);
        } catch (error) {
            console.error("Erreur lors du chargement des templates push:", error);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await AdminService.request("/api/admin/push-notifications/logs", "GET");
            setLogs(response.logs || []);
        } catch (error) {
            console.error("Erreur lors du chargement des logs push:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await AdminService.request("/api/admin/push-notifications/settings", "GET");
            setSettings(response.settings || {});
        } catch (error) {
            console.error("Erreur lors du chargement des paramètres push:", error);
            setSettings({});
        }
    };

    const saveTemplate = async (templateData, isEditing, templateId) => {
        const url = isEditing
            ? `/api/admin/push-templates/${templateId}`
            : "/api/admin/push-templates";
        const method = isEditing ? "PUT" : "POST";

        const response = await AdminService.request(url, method, templateData);
        return response;
    };

    const deleteTemplate = async (templateId) => {
        await AdminService.request(`/api/admin/push-templates/${templateId}`, "DELETE");
    };

    const testTemplate = async (templateKey, testData) => {
        const response = await AdminService.request("/api/admin/push-notifications/test", "POST", {
            templateKey,
            testData,
            language: selectedLanguage
        });
        return response;
    };

    const updateSettings = async (newSettings) => {
        const response = await AdminService.request("/api/admin/push-notifications/settings", "PUT", newSettings);
        setSettings(newSettings);
        return response;
    };

    useEffect(() => {
        fetchTemplates();
        fetchLogs();
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [selectedLanguage]);

    return {
        templates,
        logs,
        settings,
        loading,
        selectedLanguage,
        setSelectedLanguage,
        setSettings: updateSettings,
        fetchTemplates,
        fetchLogs,
        saveTemplate,
        deleteTemplate,
        testTemplate,
    };
};
