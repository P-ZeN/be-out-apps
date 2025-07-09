// Utility functions to handle date formatting between frontend and backend

/**
 * Convert various date formats to yyyy-MM-dd format for HTML date input
 * @param {string} dateString - Date string from server (should now be yyyy-MM-dd format)
 * @returns {string} - Date in yyyy-MM-dd format
 */
export const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    // If it's already in yyyy-MM-dd format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }

    // If it's an ISO string, extract just the date part
    if (dateString.includes("T")) {
        return dateString.split("T")[0];
    }

    // Return as is for any other format - server should return yyyy-MM-dd
    return dateString;
};

/**
 * Format date for server (ensure yyyy-MM-dd format)
 * @param {string} dateString - Date in yyyy-MM-dd format from HTML input
 * @returns {string} - Date in yyyy-MM-dd format
 */
export const formatDateForServer = (dateString) => {
    if (!dateString) return "";

    // If it's already in yyyy-MM-dd format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }

    // Otherwise, try to format it properly
    return formatDateForInput(dateString);
};
