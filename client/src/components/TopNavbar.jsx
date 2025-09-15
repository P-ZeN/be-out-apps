import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";
import { isAndroid } from "../utils/platform";
import {
    AppBar,
    Toolbar,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Box,
} from "@mui/material";
import {
    Search as SearchIcon,
    Tune as TuneIcon,
    LocationOn as LocationOnIcon,
} from "@mui/icons-material";

const TopNavbar = ({ onFilterOpen, searchQuery, onSearchChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation("navigation");
    const theme = useTheme();
    const [isTauriApp] = useState(getIsTauriApp());
    const [androidStatusBarHeight] = useState(() => {
        if (isTauriApp && isAndroid()) {
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.top = 'env(safe-area-inset-top, 0px)';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.pointerEvents = 'none';
            document.body.appendChild(tempDiv);

            const computedStyle = getComputedStyle(tempDiv);
            const topValue = computedStyle.top;
            document.body.removeChild(tempDiv);

            if (topValue && topValue !== '0px' && !topValue.includes('env(')) {
                return parseInt(topValue, 10) || 0;
            } else {
                const devicePixelRatio = window.devicePixelRatio || 1;
                return Math.round(24 * devicePixelRatio);
            }
        }
        return 0;
    });

    const handleMapNavigation = () => {
        navigate("/map");
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                backgroundColor: "#FFFFFF", // White background
                color: "#000000", // Black text/icons
                borderBottom: "1px solid #E0E0E0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                zIndex: 1300,
                // Handle mobile status bar for Tauri apps
                ...(isTauriApp && {
                    ...(isAndroid() ? {
                        top: `${Math.max(0, androidStatusBarHeight)}px`,
                    } : {
                        top: 'env(safe-area-inset-top, 0px)',
                    }),
                    left: 'env(safe-area-inset-left, 0px)',
                    right: 'env(safe-area-inset-right, 0px)',
                    width: 'auto',
                }),
            }}>
            <Toolbar
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: "64px",
                    height: "64px",
                    px: 2,
                }}>

                {/* App Name */}
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                        fontWeight: "bold",
                        color: "#000000", // Black text
                        textDecoration: "none",
                        fontSize: "1.55rem",
                        fontFamily: '"ClashGrotesk-Variable", sans-serif',
                        verticalAlign: "bottom",
                        marginTop: "12px",
                    }}>
                    Be Out
                </Typography>

                {/* Search Input - Center */}
                <Box sx={{ flex: 1, mx: 3, maxWidth: "400px" }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={t("search.placeholder", "Rechercher des événements...")}
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        size="small"
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
                                    borderColor: "#000000",
                                },
                            },
                            "& .MuiOutlinedInput-input": {
                                padding: "8px 14px",
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

                {/* Right Side Icons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Filters Icon */}
                    <IconButton
                        onClick={onFilterOpen}
                        sx={{
                            color: "#000000",
                            "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.04)",
                            },
                        }}
                        title={t("filters.title", "Filtres")}>
                        <TuneIcon />
                    </IconButton>

                    {/* Geoloc Icon */}
                    <IconButton
                        onClick={handleMapNavigation}
                        sx={{
                            color: "#000000",
                            "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.04)",
                            },
                        }}
                        title={t("map.title", "Voir la carte")}>
                        <LocationOnIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopNavbar;
