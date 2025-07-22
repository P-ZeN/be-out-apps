import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#FF5917", // Orange - couleur d'accent principal (unified brand)
            dark: "#E64100", // Darker orange
            light: "#FF8A50", // Lighter orange
            contrastText: "#FFFFFF", // White logo on orange background
        },
        secondary: {
            main: "#d32f2f", // Keep admin red for critical actions/alerts
            dark: "#b71c1c",
            light: "#f44336",
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
        // Custom admin colors - keep red for admin-specific elements
        admin: {
            background: "#d32f2f", // Admin red for admin-specific backgrounds
            text: "#ffffff",
            textSecondary: "rgba(255, 255, 255, 0.8)",
            alert: "#d32f2f", // Red for alerts/critical actions
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
                    color: "#FFFFFF", // White text for admin
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
                filled: {
                    backgroundColor: "#FF5917",
                    color: "#FFFFFF",
                },
            },
        },
        // Admin-specific component overrides
        MuiAlert: {
            styleOverrides: {
                standardError: {
                    backgroundColor: "#d32f2f", // Keep red for admin alerts
                    color: "#ffffff",
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    "&:hover": {
                        backgroundColor: "rgba(255, 89, 23, 0.08)", // Light orange hover
                        color: "#140F0B", // Dark text on hover
                        "& .MuiListItemIcon-root": {
                            color: "#140F0B", // Dark icon on hover
                        },
                    },
                    "&.Mui-selected": {
                        backgroundColor: "#FF5917", // Orange background for selected
                        color: "#FFFFFF", // White text for selected
                        "&:hover": {
                            backgroundColor: "#E64100", // Darker orange on hover when selected
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
