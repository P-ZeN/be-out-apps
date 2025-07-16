import React, { useState } from "react";
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Button,
    Avatar,
    Chip,
    Divider,
    useTheme,
    useMediaQuery,
    IconButton,
    Badge,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    Dashboard,
    Event,
    BookOnline,
    TrendingUp,
    Person,
    Notifications,
    ExitToApp,
    MenuOpen,
    Menu as MenuIcon,
    Add,
    Settings,
    Business,
    LocationOn,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

const OrganizerMainLayout = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, logout } = useAuth();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
        handleProfileMenuClose();
    };

    const menuItems = [
        {
            text: "Tableau de bord",
            icon: <Dashboard />,
            path: "/dashboard",
        },
        {
            text: "Mes événements",
            icon: <Event />,
            path: "/events",
        },
        {
            text: "Notifications",
            icon: <Notifications />,
            path: "/notifications",
        },
        {
            text: "Mes lieux",
            icon: <LocationOn />,
            path: "/venues",
        },
        {
            text: "Réservations",
            icon: <BookOnline />,
            path: "/bookings",
        },
        {
            text: "Revenus",
            icon: <TrendingUp />,
            path: "/revenue",
        },
        {
            text: "Mon profil",
            icon: <Business />,
            path: "/profile",
        },
    ];

    const getStatusChip = () => {
        if (!profile) return null;

        const status = profile.status || "pending";
        const statusConfig = {
            approved: { label: "Approuvé", color: "success" },
            pending: { label: "En attente", color: "warning" },
            suspended: { label: "Suspendu", color: "error" },
            rejected: { label: "Rejeté", color: "error" },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
                <Typography variant="h6" fontWeight="bold">
                    Be-Out
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Espace Organisateur
                </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", mr: 2 }}>
                        {profile?.company_name?.charAt(0) || user?.email?.charAt(0) || "O"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            {profile?.company_name || "Nouvel organisateur"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
                {getStatusChip()}
            </Box>

            <Divider />

            <List sx={{ flex: 1, pt: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "white",
                                    "&:hover": {
                                        bgcolor: "primary.dark",
                                    },
                                },
                            }}>
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path ? "white" : "inherit",
                                }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider />

            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate("/events/new")}
                    sx={{ mb: 1 }}>
                    Nouvel événement
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 1,
                }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: "none" } }}>
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text || "Be-Out Organisateur"}
                    </Typography>

                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <Badge badgeContent={0} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>

                    <IconButton
                        color="inherit"
                        onClick={handleProfileMenuOpen}
                        aria-label="account of current user"
                        aria-controls="profile-menu"
                        aria-haspopup="true">
                        <Avatar sx={{ width: 32, height: 32 }}>
                            {profile?.company_name?.charAt(0) || user?.email?.charAt(0) || "O"}
                        </Avatar>
                    </IconButton>

                    <Menu
                        id="profile-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}>
                        <MenuItem
                            onClick={() => {
                                navigate("/profile");
                                handleProfileMenuClose();
                            }}>
                            <ListItemIcon>
                                <Settings fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Paramètres</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <ExitToApp fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Déconnexion</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}>
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                    open>
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: "100vh",
                    bgcolor: "background.default",
                }}>
                <Toolbar />
                <Box sx={{ p: 3 }}>{children}</Box>
            </Box>
        </Box>
    );
};

export default OrganizerMainLayout;
