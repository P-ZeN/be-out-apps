import React, { useState, useEffect } from "react";
import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import FavoritesService from "../services/favoritesService";
import { useNavigate } from "react-router-dom";

const FavoriteButton = ({
    eventId,
    initialIsFavorited = false,
    size = "medium",
    color = "error",
    showTooltip = true,
    onFavoriteChange,
    sx = {},
}) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isLoading, setIsLoading] = useState(false);

    // Check favorite status on mount if user is authenticated
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (isAuthenticated && eventId) {
                try {
                    const status = await FavoritesService.checkFavoriteStatus(eventId);
                    setIsFavorited(status.is_favorited);
                } catch (error) {
                    console.error("Error checking favorite status:", error);
                }
            }
        };

        checkFavoriteStatus();
    }, [eventId, isAuthenticated]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation(); // Prevent parent click events

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (isLoading) return;

        setIsLoading(true);

        try {
            const result = await FavoritesService.toggleFavorite(eventId);
            setIsFavorited(result.is_favorited);

            // Call the callback with the new state
            if (onFavoriteChange) {
                onFavoriteChange(result.is_favorited, result);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            // You could add a snackbar or toast notification here
        } finally {
            setIsLoading(false);
        }
    };

    const getTooltipText = () => {
        if (!isAuthenticated) return "Se connecter pour ajouter aux favoris";
        return isFavorited ? "Retirer des favoris" : "Ajouter aux favoris";
    };

    const button = (
        <IconButton
            onClick={handleToggleFavorite}
            disabled={isLoading}
            size={size}
            sx={{
                color: isFavorited ? `${color}.main` : "text.secondary",
                "&:hover": {
                    color: `${color}.main`,
                    backgroundColor: `${color}.50`,
                },
                transition: "all 0.2s ease-in-out",
                ...sx,
            }}>
            {isLoading ? (
                <CircularProgress size={size === "small" ? 16 : size === "large" ? 28 : 20} />
            ) : isFavorited ? (
                <Favorite />
            ) : (
                <FavoriteBorder />
            )}
        </IconButton>
    );

    return showTooltip ? <Tooltip title={getTooltipText()}>{button}</Tooltip> : button;
};

export default FavoriteButton;
