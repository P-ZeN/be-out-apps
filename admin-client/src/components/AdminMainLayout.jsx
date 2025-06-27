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
} from "@mui/material";
import {
    Dashboard,
    Event,
    People,
    Receipt,
    Payment,
    Analytics,
    Settings,
    ExitToApp,
    MenuOpen,
    Menu,
} from "@mui/icons-material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

// Import admin pages
import AdminDashboard from "../pages/AdminDashboard";
import AdminEvents from "../pages/AdminEvents";
import AdminUsers from "../pages/AdminUsers";
import AdminBookings from "../pages/AdminBookings";
import AdminPayments from "../pages/AdminPayments";
import AdminLogs from "../pages/AdminLogs";

const drawerWidth = 280;

const AdminMainLayout = ({ user, onLogout }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            text: "Tableau de bord",
            icon: <Dashboard />,
            path: "/",
            component: AdminDashboard,
        },
        {
            text: "Événements",
            icon: <Event />,
            path: "/events",
            component: AdminEvents,
        },
        {
            text: "Utilisateurs",
            icon: <People />,
            path: "/users",
            component: AdminUsers,
        },
        {
            text: "Réservations",
            icon: <Receipt />,
            path: "/bookings",
            component: AdminBookings,
        },
        {
            text: "Paiements",
            icon: <Payment />,
            path: "/payments",
            component: AdminPayments,
        },
        {
            text: "Logs",
            icon: <Analytics />,
            path: "/logs",
            component: AdminLogs,
        },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    Be Out Admin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Panel d'administration
                </Typography>
            </Box>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) {
                                    setMobileOpen(false);
                                }
                            }}
                            sx={{
                                "&.Mui-selected": {
                                    backgroundColor: "primary.light",
                                    color: "primary.contrastText",
                                    "& .MuiListItemIcon-root": {
                                        color: "primary.contrastText",
                                    },
                                },
                            }}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2, mt: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                        {user?.email?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                            {user?.email}
                        </Typography>
                        <Chip
                            label={user?.role === "admin" ? "Admin" : "Modérateur"}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </Box>
                <Button fullWidth variant="outlined" startIcon={<ExitToApp />} onClick={onLogout} size="small">
                    Déconnexion
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                }}>
                <Toolbar>
                    {isMobile && (
                        <Button
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}>
                            <Menu />
                        </Button>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text || "Administration"}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
                aria-label="admin navigation">
                <Drawer
                    variant={isMobile ? "temporary" : "permanent"}
                    open={isMobile ? mobileOpen : true}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            display: "flex",
                            flexDirection: "column",
                        },
                    }}>
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: 7, sm: 8 },
                }}>
                <Routes>
                    <Route path="/" element={<AdminDashboard user={user} />} />
                    <Route path="/events" element={<AdminEvents user={user} />} />
                    <Route path="/users" element={<AdminUsers user={user} />} />
                    <Route path="/bookings" element={<AdminBookings user={user} />} />
                    <Route path="/payments" element={<AdminPayments user={user} />} />
                    <Route path="/logs" element={<AdminLogs user={user} />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminMainLayout;
