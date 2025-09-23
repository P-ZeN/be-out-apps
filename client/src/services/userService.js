// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = `${API_BASE_URL}/api/profile`;

const getProfile = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

const updateProfile = async (profileData) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
    });
    return response.json();
};

const updateLanguagePreference = async (languageCode) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/language-preference`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferred_language: languageCode }),
    });
    
    if (!response.ok) {
        throw new Error('Failed to update language preference');
    }
    
    return response.json();
};

export default {
    getProfile,
    updateProfile,
    updateLanguagePreference,
};
