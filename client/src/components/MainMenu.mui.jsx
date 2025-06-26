import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import Tooltip from "@mui/material/Tooltip";

const MainMenu = () => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="fixed" color="default" elevation={0} sx={{ mb: 0 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <IconButton component={Link} to="/" edge="start" color="primary" aria-label="home" sx={{ mr: 2 }}>
                    <HomeIcon fontSize="large" />
                </IconButton>
                <div>
                    <Tooltip title={user ? "Account" : "Login/Register"}>
                        <IconButton
                            color="primary"
                            onClick={handleMenuOpen}
                            aria-controls="account-menu"
                            aria-haspopup="true"
                            size="large">
                            <PersonIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
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
                                      Profile
                                  </MenuItem>,
                                  <MenuItem
                                      key="logout"
                                      onClick={() => {
                                          logout();
                                          handleMenuClose();
                                      }}>
                                      Logout
                                  </MenuItem>,
                              ]
                            : [
                                  <MenuItem key="login" component={Link} to="/login" onClick={handleMenuClose}>
                                      Login
                                  </MenuItem>,
                                  <MenuItem key="register" component={Link} to="/register" onClick={handleMenuClose}>
                                      Register
                                  </MenuItem>,
                              ]}
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default MainMenu;
