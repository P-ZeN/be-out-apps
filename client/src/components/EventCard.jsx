import { Box, Typography, Button, Card, CardContent, CardMedia, Chip, IconButton, Stack } from "@mui/material";
import { Schedule, LocationOn, LocalOffer, Share, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import FavoriteButton from "./FavoriteButton";
import { getEventPricingInfo, formatPriceDisplay } from "../utils/pricingUtils";

const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const { t } = useTranslation(["home", "common"]);
    const theme = useTheme();

    return (
        <Card
            sx={{
                height: "100%",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 1,
                },
                position: "relative",
                boxShadow: 1,
                borderRadius: 0,

            }}
            onClick={() => navigate(`/event/${event.id}`)}>
            {/* Favorite Button - positioned absolutely */}
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
                <FavoriteButton
                    eventId={event.id}
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        "&:hover": {
                            backgroundColor: theme.palette.background.paper,
                        },
                    }}
                />
            </Box>

            <CardMedia component="img" height="200" image={event.image_url} alt={event.title} />
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                        {event.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small">
                            <Share />
                        </IconButton>
                    </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.short_description || event.description}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {event.categories &&
                        event.categories.map((category, index) => (
                            <Chip key={index} label={category} size="small" color="primary" variant="outlined" />
                        ))}
                    {event.is_last_minute && (
                        <Chip label={t("home:badges.lastMinute")} size="small" color="error" icon={<LocalOffer />} />
                    )}
                </Stack>

                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Schedule sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <LocationOn sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                        {event.venue?.city || event.venue_city}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                            {(() => {
                                const pricingInfo = getEventPricingInfo(event);
                                const priceDisplay = formatPriceDisplay(pricingInfo, {
                                    showRange: pricingInfo.hasMultiplePrices
                                });

                                if (pricingInfo.price === 0) {
                                    return (
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: "bold" }}>
                                            {t("common:free", "Gratuit")}
                                        </Typography>
                                    );
                                }

                                return (
                                    <>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                            {priceDisplay.displayPrice}
                                        </Typography>
                                        {priceDisplay.showStrikethrough && (
                                            <Typography
                                                variant="body2"
                                                sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                                {priceDisplay.originalPrice}
                                            </Typography>
                                        )}
                                        {priceDisplay.showDiscountBadge && (
                                            <Chip
                                                label={`-${priceDisplay.discountPercentage}%`}
                                                size="small"
                                                color="success"
                                                sx={{ fontWeight: "bold" }}
                                            />
                                        )}
                                        {pricingInfo.hasMultiplePrices && (
                                            <Chip
                                                label="Plusieurs tarifs"
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {event.available_tickets > 0
                                ? `${event.available_tickets} ${t("home:ticketsAvailable", "billets disponibles")}`
                                : t("home:soldOut", "Complet")
                            }
                        </Typography>
                    </Box>
                    <Button variant="contained" size="small" endIcon={<ArrowForward />}>
                        {t("common:buttons.buyNow")}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default EventCard;
