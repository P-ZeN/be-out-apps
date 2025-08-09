import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";
import { isAndroid } from "../utils/platform";
import {
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Button,
    Box,
    Typography,
    Tabs,
    Tab,
    Divider,
} from "@mui/material";
import { Person as PersonIcon, Home as HomeIcon, Map as MapIcon, Event as EventIcon, Dashboard as DashboardIcon } from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";

const MainMenu = () => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isTauriApp, setIsTauriApp] = useState(false);
    const [androidStatusBarHeight, setAndroidStatusBarHeight] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation("navigation");
    const theme = useTheme();

    useEffect(() => {
        const detectedTauriApp = getIsTauriApp();
        setIsTauriApp(detectedTauriApp);

        // Debug logging for mobile status bar fix
        console.log('🔍 MainMenu Platform Detection:', {
            isTauriApp: detectedTauriApp,
            isAndroid: isAndroid(),
            location: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        });

        // Android-specific status bar height detection for Tauri apps
        if (detectedTauriApp && isAndroid()) {
            console.log('📱 Android Tauri detected - calculating status bar height');

            // Method 1: Try to get actual safe area value via CSS
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.top = 'env(safe-area-inset-top, 0px)';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.pointerEvents = 'none';
            document.body.appendChild(tempDiv);

            const computedStyle = getComputedStyle(tempDiv);
            const topValue = computedStyle.top;
            document.body.removeChild(tempDiv);

            let statusBarHeight = 0;
            if (topValue && topValue !== '0px' && !topValue.includes('env(')) {
                // CSS env() worked, parse the value
                statusBarHeight = parseInt(topValue, 10) || 0;
                console.log('✅ Got status bar height from CSS env():', statusBarHeight + 'px', '(will subtract 15px for positioning)');
            } else {
                // Fallback: Use common Android status bar heights
                // Most Android devices have 24dp status bar, which is ~48px on 2x density
                const devicePixelRatio = window.devicePixelRatio || 1;
                statusBarHeight = Math.round(24 * devicePixelRatio); // 24dp converted to px
                console.log('⚠️ CSS env() not working, using fallback height:', statusBarHeight + 'px', '(will subtract 15px for positioning)');
            }

            setAndroidStatusBarHeight(statusBarHeight);
        }

        if (detectedTauriApp) {
            console.log('📱 MainMenu: Tauri mobile detected - AppBar will use safe area positioning');
        }
    }, []);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getCurrentTab = () => {
        // For Tauri apps (mobile), only Events (0) and Map (1) tabs exist
        if (isTauriApp) {
            if (location.pathname === "/events" || location.pathname === "/" || location.pathname === "/home") return 0;
            if (location.pathname === "/map") return 1;
            return 0; // Default to events for mobile
        }

        // For web apps with authenticated users: Dashboard (0), Events (1), Map (2)
        // For web apps without authentication: Home (0), Events (1), Map (2)
        if (user) {
            if (location.pathname === "/dashboard") return 0;
            if (location.pathname === "/events") return 1;
            if (location.pathname === "/map") return 2;
            return 0; // Default to dashboard for logged-in users
        } else {
            if (location.pathname === "/" || location.pathname === "/home") return 0;
            if (location.pathname === "/events") return 1;
            if (location.pathname === "/map") return 2;
            return 0;
        }
    };

    const handleTabChange = (event, newValue) => {
        if (isTauriApp) {
            // For mobile: 0=Events, 1=Map
            if (newValue === 0) navigate("/events");
            if (newValue === 1) navigate("/map");
        } else {
            if (user) {
                // For authenticated web users: 0=Dashboard, 1=Events, 2=Map
                if (newValue === 0) navigate("/dashboard");
                if (newValue === 1) navigate("/events");
                if (newValue === 2) navigate("/map");
            } else {
                // For non-authenticated web users: 0=Home, 1=Events, 2=Map
                if (newValue === 0) navigate("/");
                if (newValue === 1) navigate("/events");
                if (newValue === 2) navigate("/map");
            }
        }
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                backgroundColor: theme.palette.mainMenu.background,
                color: theme.palette.mainMenu.text,
                borderBottom: `1px solid #FF9966`, // Same lightened orange as menu borders
                boxShadow: "none",
                // Handle mobile status bar for Tauri apps
                ...(isTauriApp && {
                    // For Android: Use JavaScript-calculated height since CSS env() might not work properly
                    ...(isAndroid() ? {
                        top: `${Math.max(0, androidStatusBarHeight - 15)}px`, // Temporary: reduce by 15px
                    } : {
                        // For iOS: CSS env() works well
                        top: 'env(safe-area-inset-top, 0px)',
                    }),
                    // Ensure content doesn't overflow safe areas on sides
                    left: 'env(safe-area-inset-left, 0px)',
                    right: 'env(safe-area-inset-right, 0px)',
                    width: 'auto', // Let it adapt to safe areas
                    zIndex: 1200, // Above background but below modals
                }),
            }}>
            <Toolbar
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "stretch",
                    minHeight: "72px",
                    height: "72px",
                }}>
                {/* Logo/Brand */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                        component={Link}
                        to="/"
                        edge="start"
                        color="inherit"
                        sx={{
                            mr: 0.5,
                            p: 0.5,
                        }}
                        aria-label="Be Out - Accueil">
                        <Box
                            component="img"
                            src="/be-out_logo.svg"
                            alt="Be Out Logo"
                            sx={{
                                height: 48, // Increased from 32 to 48 (50% bigger)
                                width: "auto",
                                filter: "brightness(0) invert(1)", // Make logo white for orange background
                            }}
                        />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{
                            fontWeight: "bold",
                            color: "inherit",
                            textDecoration: "none",
                            // Hide visually but keep for screen readers
                            position: "absolute",
                            left: "-10000px",
                            width: "1px",
                            height: "1px",
                            overflow: "hidden",
                        }}>
                        Be Out
                    </Typography>
                </Box>

                {/* Navigation Tabs */}
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <Tabs
                        value={getCurrentTab()}
                        onChange={handleTabChange}
                        textColor="inherit"
                        sx={{
                            "& .MuiTab-root": {
                                color: theme.palette.brand.sombre, // Dark color for normal state
                                opacity: 0.8,
                                borderLeft: `1px solid #FF9966`, // Lightened orange (40% lighter)
                                mx: 0,
                                "&:hover": {
                                    backgroundColor: theme.palette.brand.creme, // Crème background on hover
                                    color: theme.palette.brand.sombre, // Dark text on hover
                                    opacity: 1,
                                },
                                "&.Mui-selected": {
                                    backgroundColor: theme.palette.brand.creme, // Crème background for selected
                                    color: theme.palette.brand.sombre, // Dark text for selected
                                    opacity: 1,
                                },
                                "&:last-of-type": {
                                    borderRight: `1px solid #FF9966`, // Right border for last tab
                                },
                            },
                            "& .MuiTabs-indicator": {
                                display: "none", // Remove the bottom indicator
                            },
                        }}>
                        {!isTauriApp && !user && (
                            <Tab icon={<HomeIcon />} label={t("menu.home", "Accueil")} iconPosition="start" />
                        )}
                        {!isTauriApp && user && (
                            <Tab icon={<DashboardIcon />} label="Tableau de bord" iconPosition="start" />
                        )}
                        <Tab icon={<EventIcon />} label={t("menu.events", "Événements")} iconPosition="start" />
                        <Tab icon={<MapIcon />} label={t("menu.map", "Carte")} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Mobile Navigation */}
                <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
                    {!isTauriApp && !user && (
                        <IconButton
                            component={Link}
                            to="/"
                            sx={{
                                color:
                                    location.pathname === "/" || location.pathname === "/home"
                                        ? "#FFFFFF" // White for active
                                        : theme.palette.brand.sombre, // Dark for normal
                                "&:hover": {
                                    color: "#FFFFFF", // White on hover
                                },
                            }}
                            title={t("menu.home", "Accueil")}>
                            <HomeIcon />
                        </IconButton>
                    )}
                    {!isTauriApp && user && (
                        <IconButton
                            component={Link}
                            to="/dashboard"
                            sx={{
                                color:
                                    location.pathname === "/dashboard"
                                        ? "#FFFFFF" // White for active
                                        : theme.palette.brand.sombre, // Dark for normal
                                "&:hover": {
                                    color: "#FFFFFF", // White on hover
                                },
                            }}
                            title="Tableau de bord">
                            <DashboardIcon />
                        </IconButton>
                    )}
                    <IconButton
                        component={Link}
                        to={isTauriApp ? "/" : "/events"}
                        sx={{
                            color:
                                (isTauriApp && (location.pathname === "/" || location.pathname === "/home")) ||
                                (!isTauriApp && location.pathname === "/events")
                                    ? "#FFFFFF" // White for active
                                    : theme.palette.brand.sombre, // Dark for normal
                            "&:hover": {
                                color: "#FFFFFF", // White on hover
                            },
                        }}
                        title={t("menu.events", "Événements")}>
                        <EventIcon />
                    </IconButton>
                    <IconButton
                        component={Link}
                        to="/map"
                        sx={{
                            color:
                                location.pathname === "/map"
                                    ? "#FFFFFF" // White for active
                                    : theme.palette.brand.sombre, // Dark for normal
                            "&:hover": {
                                color: "#FFFFFF", // White on hover
                            },
                        }}
                        title={t("menu.map", "Carte")}>
                        <MapIcon />
                    </IconButton>
                </Box>

                {/* Right Side - Language Switcher & User Menu */}
                <Box sx={{ display: "flex", alignItems: "stretch", gap: 0, height: "72px" }}>
                    <Box
                        sx={{
                            display: { xs: "none", md: "flex" },
                            alignItems: "center",
                            borderLeft: `1px solid #FF9966`, // Lightened orange (40% lighter)
                            px: 2, // Padding on both sides
                            height: "72px", // Match toolbar height
                            "&:hover": {
                                backgroundColor: theme.palette.brand.creme, // Crème background on hover
                                "& .MuiIconButton-root": {
                                    color: theme.palette.brand.sombre, // Dark text on hover
                                },
                            },
                            transition: "background-color 0.2s ease",
                        }}>
                        <LanguageSwitcher />
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            borderLeft: `1px solid #FF9966`, // Lightened orange (40% lighter)
                            px: 2, // Padding on both sides
                            height: "72px", // Match toolbar height
                            "&:hover": {
                                backgroundColor: theme.palette.brand.creme, // Crème background on hover
                                "& .MuiIconButton-root": {
                                    color: theme.palette.brand.sombre, // Dark text on hover
                                    backgroundColor: "transparent", // Override button's own hover background
                                },
                            },
                            transition: "background-color 0.2s ease",
                        }}>
                        <IconButton
                            sx={{
                                color: theme.palette.brand.sombre, // Dark color for normal state
                                borderRadius: 0, // Remove rounded corners
                                "&:hover": {
                                    backgroundColor: "transparent", // Let parent handle background
                                    color: "inherit", // Inherit color from parent hover state
                                },
                            }}
                            onClick={handleMenuOpen}
                            aria-controls="account-menu"
                            aria-haspopup="true"
                            size="large">
                            <PersonIcon />
                        </IconButton>
                    </Box>

                    <Menu
                        id="account-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}>
                        {user
                            ? [
                                  <MenuItem key="dashboard" component={Link} to="/dashboard" onClick={handleMenuClose}>
                                      Mon tableau de bord
                                  </MenuItem>,
                                  <MenuItem key="profile" component={Link} to="/profile" onClick={handleMenuClose}>
                                      {t("menu.profile")}
                                  </MenuItem>,
                                  <MenuItem key="favorites" component={Link} to="/favorites" onClick={handleMenuClose}>
                                      Mes favoris
                                  </MenuItem>,
                                  <MenuItem key="bookings" component={Link} to="/bookings" onClick={handleMenuClose}>
                                      Mes réservations
                                  </MenuItem>,
                                  <Divider key="logout-divider" />,
                                  <MenuItem
                                      key="logout"
                                      onClick={() => {
                                          logout();
                                          handleMenuClose();
                                          navigate("/");
                                      }}>
                                      {t("menu.logout")}
                                  </MenuItem>,
                              ]
                            : [
                                  <MenuItem key="login" component={Link} to="/login" onClick={handleMenuClose}>
                                      {t("menu.login")}
                                  </MenuItem>,
                                  <MenuItem key="register" component={Link} to="/register" onClick={handleMenuClose}>
                                      {t("menu.register")}
                                  </MenuItem>,
                              ]}
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default MainMenu;
