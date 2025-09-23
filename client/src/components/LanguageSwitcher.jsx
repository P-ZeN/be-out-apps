import React from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Language as LanguageIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" },
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const theme = useTheme();
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = async (langCode) => {
        try {
            // Update frontend language
            i18n.changeLanguage(langCode);
            
            // Save language preference to user profile if user is logged in
            if (user && user.id) {
                await userService.updateLanguagePreference(langCode);
                console.log(`Language preference updated to: ${langCode}`);
            }
        } catch (error) {
            console.error('Failed to update language preference:', error);
            // Language change will still work on frontend even if server update fails
        }
        
        handleMenuClose();
    };

    const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                aria-controls="language-menu"
                aria-haspopup="true"
                title="Changer de langue"
                sx={{
                    color: theme.palette.brand.sombre, // Dark color for normal state
                    borderRadius: 0, // Remove rounded corners to match navbar style
                    "&:hover": {
                        backgroundColor: "transparent", // Let parent container handle background
                        color: "inherit", // Inherit color from parent hover state
                    },
                }}>
                <LanguageIcon />
            </IconButton>
            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}>
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={language.code === i18n.language}>
                        <ListItemIcon>
                            <span style={{ fontSize: "1.2rem" }}>{language.flag}</span>
                        </ListItemIcon>
                        <ListItemText>{language.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;
