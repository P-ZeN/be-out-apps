import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#d32f2f", // Admin red theme
            dark: "#b71c1c",
            light: "#f44336",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#424242", // Admin gray
            dark: "#212121",
            light: "#757575",
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
        // Custom admin colors
        admin: {
            background: "#d32f2f",
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
    spacing: 8,
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    zIndex: 1300,
                },
            },
        },
    },
});
