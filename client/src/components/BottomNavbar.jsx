import React, { useState } from "react";
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
    Typography,
    Box,
    Menu,
    MenuItem,
    Divider,
    TextField,
    InputAdornment,
} from "@mui/material";
import {
    Explore as CompassIcon,
    Search as SearchIcon,
    FavoriteBorder as HeartIcon,
    Person as UserIcon,
} from "@mui/icons-material";

const BottomNavbar = ({ searchQuery, onSearchChange, showSearchField, onToggleSearch }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation("navigation");
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isTauriApp] = useState(getIsTauriApp());

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleProfileMenuClose();
        navigate("/");
    };

    const NavigationButton = ({ icon, label, path, onClick, active = false }) => (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
            }}>
            <IconButton
                component={path ? Link : "button"}
                to={path}
                onClick={onClick}
                sx={{
                    color: active ? "#FF5917" : "#000000", // Orange for active, black for inactive
                    "&:hover": {
                        backgroundColor: "rgba(255, 89, 23, 0.04)",
                    },
                    p: 1,
                }}>
                {icon}
            </IconButton>
            <Typography
                variant="caption"
                sx={{
                    fontSize: "0.75rem",
                    color: active ? "#FF5917" : "#000000",
                    fontWeight: active ? 600 : 400,
                    mt: 0.5,
                }}>
                {label}
            </Typography>
        </Box>
    );

    return (
        <>
            {/* Search Field Overlay - appears when search is toggled */}
            {showSearchField && (
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 80, // Above bottom navbar
                        left: 0,
                        right: 0,
                        backgroundColor: "#FFFFFF",
                        borderTop: "1px solid #E0E0E0",
                        p: 2,
                        zIndex: 1299, // Below top navbar but above content
                        // Handle mobile safe areas for Tauri apps
                        ...(isTauriApp && {
                            left: 'env(safe-area-inset-left, 0px)',
                            right: 'env(safe-area-inset-right, 0px)',
                        }),
                    }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={t("search.placeholder", "Rechercher des événements...")}
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        size="small"
                        autoFocus
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: "#F5F5F5",
                                borderRadius: "24px",
                                "& fieldset": {
                                    borderColor: "#E0E0E0",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#BDBDBD",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#FF5917", // Orange focus
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#757575" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}

            {/* Bottom Navigation */}
            <AppBar
                position="fixed"
                sx={{
                    top: "auto",
                    bottom: 0,
                    backgroundColor: "#FFFFFF", // White background
                    color: "#000000", // Black text/icons
                    borderTop: "1px solid #E0E0E0",
                    boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1300,
                    // Handle mobile safe areas for Tauri apps
                    ...(isTauriApp && {
                        left: 'env(safe-area-inset-left, 0px)',
                        right: 'env(safe-area-inset-right, 0px)',
                        bottom: 'env(safe-area-inset-bottom, 0px)',
                        width: 'auto',
                    }),
                }}>
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        minHeight: "72px",
                        height: "72px",
                        px: 1,
                    }}>

                    {/* Découvrir (Compass) */}
                    <NavigationButton
                        icon={<CompassIcon />}
                        label="Découvrir"
                        path="/events"
                        active={location.pathname === "/events" || location.pathname === "/" || location.pathname === "/home"}
                    />

                    {/* Search */}
                    <NavigationButton
                        icon={<SearchIcon />}
                        label="Recherche"
                        onClick={onToggleSearch}
                        active={showSearchField}
                    />

                    {/* Favorites */}
                    <NavigationButton
                        icon={<HeartIcon />}
                        label="Favoris"
                        path="/favorites"
                        active={location.pathname === "/favorites"}
                    />

                    {/* Profile */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex: 1,
                        }}>
                        <IconButton
                            onClick={handleProfileMenuOpen}
                            sx={{
                                color: Boolean(anchorEl) ? "#FF5917" : "#000000", // Orange for active, black for inactive
                                "&:hover": {
                                    backgroundColor: "rgba(255, 89, 23, 0.04)",
                                },
                                p: 1,
                            }}>
                            <UserIcon />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: "0.75rem",
                                color: Boolean(anchorEl) ? "#FF5917" : "#000000",
                                fontWeight: Boolean(anchorEl) ? 600 : 400,
                                mt: 0.5,
                            }}>
                            Profil
                        </Typography>
                    </Box>

                    {/* Profile Menu */}
                    <Menu
                        id="profile-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
                        sx={{
                            "& .MuiPaper-root": {
                                marginBottom: "8px", // Small margin above navbar
                            },
                        }}>
                        {user ? [
                            <MenuItem
                                key="dashboard"
                                component={Link}
                                to="/dashboard"
                                onClick={handleProfileMenuClose}>
                                {t("menu.dashboard", "Mon tableau de bord")}
                            </MenuItem>,
                            <MenuItem
                                key="profile"
                                component={Link}
                                to="/profile"
                                onClick={handleProfileMenuClose}>
                                {t("menu.profile", "Mon profil")}
                            </MenuItem>,
                            <MenuItem
                                key="bookings"
                                component={Link}
                                to="/bookings"
                                onClick={handleProfileMenuClose}>
                                {t("menu.bookings", "Mes réservations")}
                            </MenuItem>,
                            <Divider key="logout-divider" />,
                            <MenuItem
                                key="logout"
                                onClick={handleLogout}>
                                {t("menu.logout", "Se déconnecter")}
                            </MenuItem>,
                        ] : [
                            <MenuItem
                                key="login"
                                component={Link}
                                to="/login"
                                onClick={handleProfileMenuClose}>
                                {t("menu.login", "Se connecter")}
                            </MenuItem>,
                            <MenuItem
                                key="register"
                                component={Link}
                                to="/register"
                                onClick={handleProfileMenuClose}>
                                {t("menu.register", "S'inscrire")}
                            </MenuItem>,
                        ]}
                    </Menu>
                </Toolbar>
            </AppBar>
        </>
    );
};

export default BottomNavbar;
