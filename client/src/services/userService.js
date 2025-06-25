const API_URL = "http://localhost:3000/user";

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
