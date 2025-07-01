// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL.replace('/api', '')}/user`;

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

export default {
    getProfile,
    updateProfile,
};
