import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#0288d1", // Primary blue
            dark: "#01579b",
            light: "#4fc3f7",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#FFCC00", // Secondary yellow
            dark: "#f57f17",
            light: "#fff176",
            contrastText: "#000000",
        },
        background: {
            default: "#fafafa",
            paper: "#ffffff",
        },
        text: {
            primary: "#212121",
            secondary: "#757575",
        },
        // Custom color for footer
        footer: {
            background: "#0288d1", // Use primary color
            text: "#ffffff",
            textSecondary: "rgba(255, 255, 255, 0.8)",
        },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
        fontSize: 14,
        h6: {
            fontWeight: 600,
        },
        body2: {
            fontSize: "0.875rem",
        },
    },
    spacing: 8, // The default spacing unit
    components: {
        // Override MUI component styles globally
        MuiAppBar: {
            styleOverrides: {
                root: {
                    zIndex: 1300,
                },
            },
        },
    },
});
