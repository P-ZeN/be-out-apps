const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class FileService {
    async uploadEventImage(file) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`${API_BASE_URL}/api/files/event-image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload image");
        }

        return response.json();
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch(`${API_BASE_URL}/api/files/avatar`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload avatar");
        }

        return response.json();
    }

    async deleteFile(filename) {
        const response = await fetch(`${API_BASE_URL}/api/files/${filename}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete file");
        }

        return response.json();
    }

    // Method specifically for content featured images
    async uploadContentImage(file) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`${API_BASE_URL}/api/files/content-image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload content image");
        }

        return response.json();
    }
}

const fileService = new FileService();
export default fileService;
