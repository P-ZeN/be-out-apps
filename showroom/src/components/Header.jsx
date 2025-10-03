import { AppBar, Toolbar, Box, Button, IconButton, useMediaQuery, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
    const theme = useTheme();
    const { t } = useTranslation('showroom');
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { path: '/', label: t('nav.home', 'Home') },
        { path: '/blog', label: t('nav.blog', 'Blog') },
        { path: '/about', label: t('nav.about', 'About') },
    ];

    const handleMobileMenuToggle = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuOpen(false);
    };

    return (
        <>
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    {/* Logo */}
                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                            mr: 4,
                        }}
                    >
                        <Box
                            component="img"
                            src="/be-out_icon_512.svg"
                            alt="Be Out Logo"
                            sx={{
                                height: 40,
                                width: 'auto',
                            }}
                        />
                    </Box>

                    {/* Desktop Navigation */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 2, mr: 'auto' }}>
                            {navigation.map((item) => (
                                <Button
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    sx={{
                                        color: theme.palette.primary.contrastText,
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        textDecoration: location.pathname === item.path ? 'underline' : 'none',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    {/* Desktop Language Switcher and CTA Button */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <LanguageSwitcher />
                            <Button
                                variant="contained"
                                href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: theme.palette.background.default,
                                    },
                                }}
                            >
                                {t('nav.openApp', 'Open App')}
                            </Button>
                        </Box>
                    )}

                    {/* Mobile Menu Button */}
                    {isMobile && (
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={handleMobileMenuToggle}
                            sx={{ ml: 'auto' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={handleMobileMenuClose}
                PaperProps={{
                    sx: {
                        width: 280,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <IconButton
                        onClick={handleMobileMenuClose}
                        sx={{ color: theme.palette.primary.contrastText, mb: 2 }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <List>
                        <ListItem sx={{ justifyContent: 'center', mb: 2 }}>
                            <LanguageSwitcher />
                        </ListItem>
                        {navigation.map((item) => (
                            <ListItem
                                button
                                key={item.path}
                                component={Link}
                                to={item.path}
                                onClick={handleMobileMenuClose}
                                sx={{
                                    borderRadius: 1,
                                    mb: 1,
                                    backgroundColor: location.pathname === item.path
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'transparent',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={item.label}
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            fontWeight: location.pathname === item.path ? 600 : 400,
                                        },
                                    }}
                                />
                            </ListItem>
                        ))}
                        <ListItem
                            button
                            component="a"
                            href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleMobileMenuClose}
                            sx={{
                                borderRadius: 1,
                                mt: 2,
                                backgroundColor: theme.palette.background.paper,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.background.default,
                                },
                            }}
                        >
                            <ListItemText
                                primary={t('nav.openApp', 'Open App')}
                                sx={{
                                    textAlign: 'center',
                                    '& .MuiListItemText-primary': {
                                        fontWeight: 600,
                                    },
                                }}
                            />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default Header;
