import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
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
import { Person as PersonIcon, Home as HomeIcon, Map as MapIcon, Event as EventIcon } from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";

const MainMenu = () => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation("navigation");
    const theme = useTheme();

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getCurrentTab = () => {
        if (location.pathname === "/" || location.pathname === "/home") return 0;
        if (location.pathname === "/events") return 1;
        if (location.pathname === "/map") return 2;
        return 0;
    };

    const handleTabChange = (event, newValue) => {
        if (newValue === 0) navigate("/");
        if (newValue === 1) navigate("/events");
        if (newValue === 2) navigate("/map");
    };

    return (
        <AppBar position="fixed" color="default" elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Logo/Brand */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton component={Link} to="/" edge="start" color="primary" sx={{ mr: 1 }}>
                        <EventIcon fontSize="large" />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                            textDecoration: "none",
                            display: { xs: "none", sm: "block" },
                        }}>
                        Be Out
                    </Typography>
                </Box>

                {/* Navigation Tabs */}
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <Tabs
                        value={getCurrentTab()}
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary">
                        <Tab icon={<HomeIcon />} label={t("menu.home", "Accueil")} iconPosition="start" />
                        <Tab icon={<EventIcon />} label={t("menu.events", "Événements")} iconPosition="start" />
                        <Tab icon={<MapIcon />} label={t("menu.map", "Carte")} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Mobile Navigation */}
                <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
                    <IconButton
                        component={Link}
                        to="/"
                        color={location.pathname === "/" || location.pathname === "/home" ? "primary" : "default"}
                        title={t("menu.home", "Accueil")}>
                        <HomeIcon />
                    </IconButton>
                    <IconButton
                        component={Link}
                        to="/events"
                        color={location.pathname === "/events" ? "primary" : "default"}
                        title={t("menu.events", "Événements")}>
                        <EventIcon />
                    </IconButton>
                    <IconButton
                        component={Link}
                        to="/map"
                        color={location.pathname === "/map" ? "primary" : "default"}
                        title={t("menu.map", "Carte")}>
                        <MapIcon />
                    </IconButton>
                </Box>

                {/* Right Side - Language Switcher & User Menu */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LanguageSwitcher />

                    <IconButton
                        color="primary"
                        onClick={handleMenuOpen}
                        aria-controls="account-menu"
                        aria-haspopup="true"
                        size="large">
                        <PersonIcon />
                    </IconButton>

                    <Menu
                        id="account-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}>
                        {user
                            ? [
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
