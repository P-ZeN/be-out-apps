// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Common headers for all API requests
const getCommonHeaders = (additionalHeaders = {}) => ({
    "Content-Type": "application/json",
    ...additionalHeaders,
});

// Enhanced fetch function with common headers
export const apiRequest = async (url, options = {}) => {
    const defaultOptions = {
        headers: getCommonHeaders(options.headers),
        ...options,
    };

    const response = await fetch(url, defaultOptions);

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
