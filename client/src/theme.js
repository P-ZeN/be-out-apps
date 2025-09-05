import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#FF5917", // Orange - couleur d'accent principal
            dark: "#E64100", // Darker orange
            light: "#FF8A50", // Lighter orange
            contrastText: "#FFFFFF", // White logo on orange background
        },
        secondary: {
            main: "#140F0B", // Sombre - for secondary actions
            dark: "#000000",
            light: "#424242",
            contrastText: "#FFFFFF",
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
            default: "#FFECE1", // Crême - fond principal/pages
            paper: "#FFFFFF", // Keep white for cards/elevated surfaces
        },
        text: {
            primary: "#140F0B", // Sombre - texte principal
            secondary: "#5D4037", // Slightly lighter dark for secondary text
        },
        // Custom color for footer - using sombre background
        footer: {
            background: "#140F0B", // Sombre background
            text: "#FFECE1", // Crème text
            textSecondary: "rgba(255, 236, 225, 0.8)", // Crème with opacity
            titleColor: "#FF5917", // Orange for titles
        },
        // Custom color for main menu - using orange background
        mainMenu: {
            background: "#FF5917", // Orange background
            text: "#FFECE1", // Crème text
            textSecondary: "rgba(255, 236, 225, 0.8)",
        },
        // Additional brand colors for consistency
        brand: {
            creme: "#FFECE1",
            orange: "#FF5917",
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
        // Hero text with InDesign-style justification
        heroTitle: {
            fontFamily: '"ClashGrotesk-Variable", sans-serif',
            fontWeight: 300, // Light weight for hero
            fontSize: "1.5rem",
            lineHeight: 1.3,
            textAlign: "justify",
            textAlignLast: "left", // Flag effect like InDesign
            wordBreak: "normal",
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
                    backgroundColor: "#FF5917", // Orange brand color
                    color: "#FFECE1", // Crème text
                    boxShadow: "none", // Remove shadow
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
                    backgroundColor: "#FF5917", // Orange for primary buttons
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#E64100", // Darker orange on hover
                    },
                },
                outlined: {
                    borderColor: "#FF5917",
                    color: "#FF5917",
                    "&:hover": {
                        borderColor: "#E64100",
                        backgroundColor: "rgba(255, 89, 23, 0.04)",
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
    },
});
