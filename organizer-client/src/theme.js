import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#2e7d32", // Organizer green theme
            dark: "#1b5e20",
            light: "#4caf50",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#ff6f00", // Orange accent
            dark: "#e65100",
            light: "#ff8f00",
            contrastText: "#ffffff",
        },
        background: {
            default: "#fafafa",
            paper: "#ffffff",
        },
        text: {
            primary: "#212121",
            secondary: "#757575",
        },
        success: {
            main: "#4caf50",
            dark: "#388e3c",
            light: "#81c784",
        },
        warning: {
            main: "#ff9800",
            dark: "#f57c00",
            light: "#ffb74d",
        },
        error: {
            main: "#f44336",
            dark: "#d32f2f",
            light: "#e57373",
        },
        // Custom organizer colors
        organizer: {
            background: "#2e7d32",
            text: "#ffffff",
            textSecondary: "rgba(255, 255, 255, 0.8)",
            revenue: "#4caf50",
            pending: "#ff9800",
            success: "#8bc34a",
        },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
        fontSize: 14,
        h4: {
            fontWeight: 700,
            fontSize: "2.125rem",
        },
        h5: {
            fontWeight: 600,
            fontSize: "1.5rem",
        },
        h6: {
            fontWeight: 600,
            fontSize: "1.25rem",
        },
        body1: {
            fontSize: "1rem",
        },
        body2: {
            fontSize: "0.875rem",
        },
        subtitle1: {
            fontWeight: 500,
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: "0.875rem",
        },
    },
    spacing: 8,
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    zIndex: 1300,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: 12,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: "none",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});
