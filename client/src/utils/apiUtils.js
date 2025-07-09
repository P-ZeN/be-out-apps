// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Common headers for all API requests
const getCommonHeaders = (additionalHeaders = {}) => {
    const token = localStorage.getItem("token");
    const baseHeaders = {
        "Content-Type": "application/json",
        ...additionalHeaders,
    };

    if (token) {
        baseHeaders.Authorization = `Bearer ${token}`;
    }

    return baseHeaders;
};

// Enhanced fetch function with common headers
export const apiRequest = async (url, options = {}) => {
    // Ensure we use the full API URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Merge headers properly - common headers first, then any additional headers
    const headers = getCommonHeaders(options.headers || {});
    
    const defaultOptions = {
        ...options,
        headers,
    };

    const response = await fetch(fullUrl, defaultOptions);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Convenience methods
export const apiGet = (url, headers = {}) => apiRequest(url, { method: "GET", headers });

export const apiPost = (url, data, headers = {}) =>
    apiRequest(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });

export const apiPut = (url, data, headers = {}) =>
    apiRequest(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
    });

export const apiDelete = (url, headers = {}) => apiRequest(url, { method: "DELETE", headers });

export { API_BASE_URL };
