import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const languages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (languageCode) => {
        i18n.changeLanguage(languageCode);
        handleClose();
    };

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<LanguageIcon />}
                onClick={handleClick}
                sx={{
                    color: 'inherit',
                    borderColor: 'currentColor',
                    '&:hover': {
                        borderColor: 'currentColor',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                }}
            >
                {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={i18n.language === language.code}
                    >
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                            <span style={{ fontSize: '1.2em' }}>{language.flag}</span>
                        </ListItemIcon>
                        <ListItemText primary={language.name} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;
