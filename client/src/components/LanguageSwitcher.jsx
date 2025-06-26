import React from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Language as LanguageIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" },
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (langCode) => {
        i18n.changeLanguage(langCode);
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
                    color: "inherit",
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                }}>
                <LanguageIcon sx={{ color: "inherit" }} />
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
