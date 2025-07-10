const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class TranslationService {
    async getTranslations(language, namespace) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch translations");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching translations:", error);
            throw error;
        }
    }

    async saveTranslations(language, namespace, translations) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
                body: JSON.stringify({ translations }),
            });

            if (!response.ok) {
                throw new Error("Failed to save translations");
            }

            return await response.json();
        } catch (error) {
            console.error("Error saving translations:", error);
            throw error;
        }
    }

    async getAvailableLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/languages`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch languages");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching languages:", error);
            // Return default languages if API fails
            return ["en", "fr", "es"];
        }
    }

    async getAvailableNamespaces(language) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/namespaces`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch namespaces");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching namespaces:", error);
            // Return default namespaces if API fails
            return ["common", "auth", "home", "navigation"];
        }
    }

    async createNamespace(language, namespace) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
                body: JSON.stringify({ translations: {} }),
            });

            if (!response.ok) {
                throw new Error("Failed to create namespace");
            }

            return await response.json();
        } catch (error) {
            console.error("Error creating namespace:", error);
            throw error;
        }
    }

    async deleteNamespace(language, namespace) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete namespace");
            }

            return await response.json();
        } catch (error) {
            console.error("Error deleting namespace:", error);
            throw error;
        }
    }

    async uploadTranslations(language, namespace, file) {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("language", language);
            formData.append("namespace", namespace);

            const response = await fetch(`${API_BASE_URL}/api/admin/translations/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload translations");
            }

            return await response.json();
        } catch (error) {
            console.error("Error uploading translations:", error);
            throw error;
        }
    }

    async exportTranslations(language, namespace) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}/export`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to export translations");
            }

            const blob = await response.blob();
            return blob;
        } catch (error) {
            console.error("Error exporting translations:", error);
            throw error;
        }
    }

    async getTranslationStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/stats`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch translation stats");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching translation stats:", error);
            throw error;
        }
    }

    async validateTranslations(language, namespace) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/translations/${language}/${namespace}/validate`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to validate translations");
            }

            return await response.json();
        } catch (error) {
            console.error("Error validating translations:", error);
            throw error;
        }
    }

    // Utility methods for working with translation files locally
    parseTranslationFile(fileContent) {
        try {
            return JSON.parse(fileContent);
        } catch (error) {
            throw new Error("Invalid JSON file format");
        }
    }

    flattenTranslations(translations, prefix = "") {
        const flattened = {};

        for (const [key, value] of Object.entries(translations)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenTranslations(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }

        return flattened;
    }

    unflattenTranslations(flatTranslations) {
        const unflattened = {};

        for (const [key, value] of Object.entries(flatTranslations)) {
            const keys = key.split(".");
            let current = unflattened;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
        }

        return unflattened;
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export default new TranslationService();
