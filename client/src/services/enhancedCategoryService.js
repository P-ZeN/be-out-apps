// Enhanced category service with multi-language support
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";

// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Base service functions
export const categoryService = {
    // Fetch categories with language parameter
    getCategories: async (language = "fr") => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/meta/categories?lang=${language}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching categories:", error);
            throw error;
        }
    },

    // Get all categories with all translations (admin only)
    getAllCategoriesWithTranslations: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching categories with translations:", error);
            throw error;
        }
    },
};

// React hook for easy category fetching with automatic language detection
export const useCategories = () => {
    const { i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryService.getCategories(i18n.language);
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [i18n.language]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
    };
};
