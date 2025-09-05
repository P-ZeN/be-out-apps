import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#110e3a", // Dark blue - couleur d'accent principal (organizer brand)
            dark: "#0a0825", // Darker blue
            light: "#1a1548", // Lighter blue
            contrastText: "#FFFFFF", // White logo on blue background
        },
        secondary: {
            main: "#d32f2f", // Keep red for critical actions/alerts
            dark: "#b71c1c",
            light: "#f44336",
            contrastText: "#ffffff",
        },
        // Semantic status colors for consistent UI
        success: {
            main: "#4caf50", // Green for positive states
            dark: "#388e3c",
            light: "#81c784",
            contrastText: "#ffffff",
        },
        error: {
            main: "#f44336", // Red for negative states
            dark: "#d32f2f",
            light: "#e57373",
            contrastText: "#ffffff",
        },
        warning: {
            main: "#ff9800", // Orange for attention states
            dark: "#f57c00",
            light: "#ffb74d",
            contrastText: "#000000",
        },
        info: {
            main: "#2196f3", // Blue for informational states
            dark: "#1976d2",
            light: "#64b5f6",
            contrastText: "#ffffff",
        },
        background: {
            default: "#FFECE1", // Crême - fond principal/pages (unified brand)
            paper: "#ffffff", // Keep white for cards/elevated surfaces
        },
        text: {
            primary: "#140F0B", // Sombre - texte principal (unified brand)
            secondary: "#5D4037", // Slightly lighter dark for secondary text
        },
        // Custom organizer colors - keep blue for organizer-specific elements
        organizer: {
            background: "#110e3a", // Blue for organizer-specific backgrounds
            text: "#ffffff",
            textSecondary: "rgba(255, 255, 255, 0.8)",
            success: "#110e3a", // Blue for success/revenue indicators
        },
        // Custom color for footer - using sombre background
        footer: {
            background: "#140F0B", // Sombre background
            text: "#FFECE1", // Crème text
            textSecondary: "rgba(255, 236, 225, 0.8)", // Crème with opacity
            titleColor: "#110e3a", // Blue for titles
        },
        // Custom color for main menu - using blue background
        mainMenu: {
            background: "#110e3a", // Blue background
            text: "#FFECE1", // Crème text
            textSecondary: "rgba(255, 236, 225, 0.8)",
        },
        // Additional brand colors for consistency
        brand: {
            creme: "#FFECE1",
            green: "#4CAF50",
            blue: "#110e3a",
            sombre: "#140F0B",
        },
    },
    typography: {
        fontFamily: '"ClashGrotesk-Variable", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 14,
        // Titres - bold, semi bold
        h1: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 700, // Bold
            fontSize: "2.5rem",
            color: "#140F0B",
        },
        h2: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold
            fontSize: "2rem",
            color: "#140F0B",
        },
        h3: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold
            fontSize: "1.75rem",
            color: "#140F0B",
        },
        h4: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold
            fontSize: "1.5rem",
            color: "#140F0B",
        },
        h5: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold
            fontSize: "1.25rem",
            color: "#140F0B",
        },
        h6: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold
            fontSize: "1.125rem",
            color: "#140F0B",
        },
        // Sous titres, exergues - extra-light ou light
        subtitle1: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 300, // Light
            fontSize: "1rem",
        },
        subtitle2: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 200, // Extra Light
            fontSize: "0.875rem",
        },
        body1: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 400, // Regular
            fontSize: "1rem",
        },
        body2: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 400, // Regular
            fontSize: "0.875rem",
        },
        button: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 600, // Semi Bold for CTAs
            textTransform: "none", // Keep original case
        },
        caption: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 300, // Light
            fontSize: "0.75rem",
        },
    },
    spacing: 8, // The default spacing unit
    components: {
        // Override MUI component styles globally
        MuiAppBar: {
            styleOverrides: {
                root: {
                    zIndex: 1300,
                    backgroundColor: "#110e3a", // Blue brand color
                    color: "#FFFFFF", // White text for organizer
                    boxShadow: "none", // Remove shadow
                    "& .MuiTypography-root": {
                        color: "#FFFFFF", // Ensure all typography in AppBar is white
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontFamily: '"ClashGrotesk-Variable", sans-serif',
                    fontWeight: 600,
                    textTransform: "none",
                },
                contained: {
                    backgroundColor: "#110e3a", // Blue for primary buttons
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#0a0825", // Darker blue on hover
                    },
                },
                outlined: {
                    borderColor: "#110e3a",
                    color: "#110e3a",
                    "&:hover": {
                        borderColor: "#0a0825",
                        backgroundColor: "rgba(17, 14, 58, 0.04)",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(20, 15, 11, 0.1)",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: '"ClashGrotesk-Variable", sans-serif',
                    fontWeight: 500,
                },
                // Remove color overrides to allow semantic colors to work properly
            },
        },
        // Organizer-specific component overrides
        MuiAlert: {
            styleOverrides: {
                standardError: {
                    backgroundColor: "#d32f2f", // Keep red for alerts
                    color: "#ffffff",
                },
                standardSuccess: {
                    backgroundColor: "#110e3a", // Blue for success
                    color: "#ffffff",
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    "&:hover": {
                        backgroundColor: "rgba(17, 14, 58, 0.08)", // Light blue hover
                        color: "#140F0B", // Dark text on hover
                        "& .MuiListItemIcon-root": {
                            color: "#140F0B", // Dark icon on hover
                        },
                    },
                    "&.Mui-selected": {
                        backgroundColor: "#110e3a", // Blue background for selected
                        color: "#FFFFFF", // White text for selected
                        "&:hover": {
                            backgroundColor: "#0a0825", // Darker blue on hover when selected
                            color: "#FFFFFF", // Keep white text
                            "& .MuiListItemIcon-root": {
                                color: "#FFFFFF", // Keep white icon
                            },
                        },
                        "& .MuiListItemIcon-root": {
                            color: "#FFFFFF", // White icon for selected
                        },
                    },
                },
            },
        },
    },
});
