const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class FileService {
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch(`${API_BASE_URL}/api/files/avatar`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload avatar");
        }

        return response.json();
    }

    async uploadEventImage(file) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`${API_BASE_URL}/api/files/event-image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload event image");
        }

        return response.json();
    }

    async uploadDocument(file) {
        const formData = new FormData();
        formData.append("document", file);

        const response = await fetch(`${API_BASE_URL}/api/files/document`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload document");
        }

        return response.json();
    }

    async deleteFile(fileName) {
        const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(fileName)}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete file");
        }

        return response.json();
    }
}

export default new FileService();
