import React from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Button,
} from "@mui/material";
import {
    Share,
    Favorite,
    Image,
    Star,
    Euro,
    CalendarToday,
    LocationOn,
    People,
} from "@mui/icons-material";

const EventMobilePreview = ({ formData, venues, categories, imagePreview }) => {
    // Helper functions
    const getSelectedVenue = () => {
        if (!formData.venue_id) return null;
        return venues.find((v) => v.id === formData.venue_id);
    };

    const getSelectedCategory = () => {
        if (!formData.category_id) return null;
        return categories.find((c) => c.id === formData.category_id);
    };

    // Helper function to extract pricing information from new or old pricing structure
    const getPricingInfo = () => {
        // Check if we have new pricing structure first
        if (formData.pricing?.categories?.length > 0) {
            // Get the first available tier from the first category
            const firstCategory = formData.pricing.categories[0];
            if (firstCategory.tiers?.length > 0) {
                const firstTier = firstCategory.tiers[0];
                return {
                    price: firstTier.price,
                    originalPrice: firstTier.originalPrice,
                    discountPercentage: firstTier.discountPercentage
                };
            }
        }

        // Fallback to old pricing structure
        return {
            price: formData.discounted_price || formData.original_price || formData.price,
            originalPrice: formData.original_price,
            discountPercentage: formData.discount_percentage
        };
    };

    const formatEventDate = (date) => {
        if (!date) return "";
        const eventDate = new Date(date);
        return eventDate.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatEventTime = (date) => {
        if (!date) return "";
        const eventDate = new Date(date);
        return eventDate.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const venue = getSelectedVenue();
    const category = getSelectedCategory();

    return (
        <Box
            sx={{
                position: "sticky",
                top: 20,
                width: "375px", // iPhone width
                height: "812px", // iPhone height
                border: "3px solid #000",
                borderRadius: "25px",
                backgroundColor: "#000",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
            }}>
            {/* Phone notch */}
            <Box
                sx={{
                    width: "150px",
                    height: "25px",
                    backgroundColor: "#000",
                    borderRadius: "0 0 15px 15px",
                    alignSelf: "center",
                    mb: 1,
                }}
            />

            {/* Phone screen */}
            <Paper
                sx={{
                    flex: 1,
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#f5f5f5",
                }}>
                <Box sx={{ height: "100%", overflow: "auto" }}>
                    {/* Header */}
                    <Box
                        sx={{
                            height: "60px",
                            backgroundColor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2,
                            color: "white",
                        }}>
                        <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold", color: "white" }}>
                            Détails de l'événement
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton size="small" sx={{ color: "white" }}>
                                <Share fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: "white" }}>
                                <Favorite fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Event Image */}
                    <Box sx={{ height: "200px", position: "relative", backgroundColor: "#e0e0e0" }}>
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Event"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "text.secondary",
                                }}>
                                <Image sx={{ fontSize: 40 }} />
                            </Box>
                        )}

                        {/* Featured badge */}
                        {formData.is_featured && (
                            <Chip
                                icon={<Star />}
                                label="En vedette"
                                color="warning"
                                size="small"
                                sx={{
                                    position: "absolute",
                                    top: 10,
                                    left: 10,
                                    fontSize: "10px",
                                }}
                            />
                        )}

                        {/* Price badge with discount support */}
                        {(() => {
                            const pricingInfo = getPricingInfo();
                            return pricingInfo.price && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 10,
                                        right: 10,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        gap: 0.5,
                                    }}>
                                    {pricingInfo.originalPrice && pricingInfo.price &&
                                     pricingInfo.originalPrice !== pricingInfo.price && pricingInfo.discountPercentage && (
                                        <Chip
                                            label={`-${pricingInfo.discountPercentage}%`}
                                            size="small"
                                            color="success"
                                            sx={{ fontSize: "10px", height: "20px" }}
                                        />
                                    )}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {pricingInfo.originalPrice && pricingInfo.price &&
                                         pricingInfo.originalPrice !== pricingInfo.price && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    textDecoration: "line-through",
                                                    color: "text.secondary",
                                                    fontSize: "10px",
                                                }}>
                                                {pricingInfo.originalPrice}€
                                            </Typography>
                                        )}
                                        <Chip
                                            icon={<Euro />}
                                            label={`${pricingInfo.price}€`}
                                            color="primary"
                                            sx={{
                                                fontWeight: "bold",
                                                fontSize: "12px",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            );
                        })()}
                    </Box>

                    {/* Event Content */}
                    <Box sx={{ p: 2 }}>
                        {/* Title */}
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: "bold",
                                mb: 1,
                                fontSize: "20px",
                                lineHeight: 1.2,
                            }}>
                            {formData.title || "Titre de l'événement"}
                        </Typography>

                        {/* Category */}
                        {category && (
                            <Chip
                                label={category.name}
                                color="secondary"
                                size="small"
                                sx={{ mb: 2, fontSize: "11px" }}
                            />
                        )}

                        {/* Date and Time */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <CalendarToday sx={{ fontSize: 16, mr: 1, color: "primary.main" }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "13px" }}>
                                    {formatEventDate(formData.event_date) || "Date à définir"}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: "11px", color: "text.secondary" }}>
                                    {formatEventTime(formData.event_date) || "Heure à définir"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Venue */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <LocationOn sx={{ fontSize: 16, mr: 1, color: "primary.main" }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "13px" }}>
                                    {venue?.name || "Lieu à définir"}
                                </Typography>
                                {venue && (
                                    <Typography variant="caption" sx={{ fontSize: "11px", color: "text.secondary" }}>
                                        {venue.formatted_address || `${venue.locality || ""}`}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Participants */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <People sx={{ fontSize: 16, mr: 1, color: "primary.main" }} />
                            <Typography variant="body2" sx={{ fontSize: "13px" }}>
                                {formData.max_participants
                                    ? `Maximum ${formData.max_participants} participants`
                                    : "Nombre de participants à définir"}
                            </Typography>
                        </Box>

                        {/* Description */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}>
                                Description
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: "13px",
                                    lineHeight: 1.4,
                                    color: formData.description ? "text.primary" : "text.secondary",
                                    fontStyle: formData.description ? "normal" : "italic",
                                }}>
                                {formData.description || "Description à ajouter..."}
                            </Typography>
                        </Box>

                        {/* Tags */}
                        {formData.tags.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}>
                                    Tags
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {formData.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: "10px" }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Requirements */}
                        {formData.requirements && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}>
                                    Prérequis
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: "13px", lineHeight: 1.4 }}>
                                    {formData.requirements}
                                </Typography>
                            </Box>
                        )}

                        {/* Cancellation Policy */}
                        {formData.cancellation_policy && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}>
                                    Politique d'annulation
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: "13px", lineHeight: 1.4 }}>
                                    {formData.cancellation_policy}
                                </Typography>
                            </Box>
                        )}

                        {/* Action Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                                mt: 2,
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: "bold",
                                fontSize: "16px",
                            }}>
                            {(() => {
                                const pricingInfo = getPricingInfo();
                                return pricingInfo.price && Number(pricingInfo.price) > 0
                                    ? `Réserver - ${pricingInfo.price}€`
                                    : "Participer gratuitement";
                            })()}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default EventMobilePreview;
