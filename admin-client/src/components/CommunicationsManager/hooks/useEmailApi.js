import { useState, useEffect } from "react";

export const useEmailApi = () => {
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState("fr");

    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    });

    const fetchTemplates = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/templates?language=${selectedLanguage}`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setTemplates(data);
        }
    };

    const fetchLogs = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/logs?limit=100`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setLogs(data.logs);
        }
    };

    const fetchSettings = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/settings`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setSettings(data);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchTemplates(), fetchLogs(), fetchSettings()]);
        } catch (error) {
            console.error("Erreur lors du chargement des données", error);
        } finally {
            setLoading(false);
        }
    };

    const saveTemplate = async (templateData, isEditing, templateId) => {
        const url = isEditing
            ? `${API_BASE_URL}/api/emails/templates/${templateId}`
            : `${API_BASE_URL}/api/emails/templates`;

        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(templateData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Échec de la sauvegarde du template");
        }

        return response.json();
    };

    const deleteTemplate = async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/emails/templates/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Échec de la suppression du template");
        }

        return response.json();
    };

    const testTemplate = async (templateId, email, variables) => {
        const response = await fetch(`${API_BASE_URL}/api/emails/templates/${templateId}/test`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                email,
                variables,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Échec de l'envoi de l'email de test");
        }

        return response.json();
    };

    useEffect(() => {
        fetchData();
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
        setSettings,
        fetchTemplates,
        fetchLogs,
        fetchSettings,
        saveTemplate,
        deleteTemplate,
        testTemplate,
    };
};
