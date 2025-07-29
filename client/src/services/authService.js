// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = `${API_BASE_URL}/api/auth`;

const register = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });
    return response.json();
};

const login = async (userData) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
    }
    return response.json();
};

const loginWithGoogleMobile = async (serverAuthCode) => {
    const response = await fetch(`${API_BASE_URL}/api/oauth/google/mobile-callback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverAuthCode }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google login failed");
    }
    return response.json();
};

export default {
    register,
    login,
    loginWithGoogleMobile,
};
