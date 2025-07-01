// Simple auth service for admin app
// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SERVER_BASE_URL = API_BASE_URL; // http://localhost:3000

class AuthService {
    static async login(email, password) {
        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Login failed");
            }

            const data = await response.json();

            // Store token
            localStorage.setItem("adminToken", data.token);

            // Fetch user profile to get role information
            const profile = await this.getProfile();

            return { token: data.token, user: profile };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    static async getProfile() {
        try {
            const token = this.getToken();
            if (!token) throw new Error("No token found");

            const response = await fetch(`${SERVER_BASE_URL}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch profile");
            }

            const user = await response.json();

            // Verify admin role
            if (!user.role || (user.role !== "admin" && user.role !== "moderator")) {
                throw new Error("Access denied: Admin privileges required");
            }

            localStorage.setItem("admin_user", JSON.stringify(user));
            return user;
        } catch (error) {
            console.error("Profile fetch error:", error);
            this.logout();
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin_user");
        window.location.href = "/";
    }

    static getToken() {
        return localStorage.getItem("adminToken");
    }

    static getCurrentUser() {
        const userString = localStorage.getItem("admin_user");
        return userString ? JSON.parse(userString) : null;
    }

    static isAuthenticated() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return token && user && (user.role === "admin" || user.role === "moderator");
    }

    static isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === "admin";
    }
}

export default AuthService;
