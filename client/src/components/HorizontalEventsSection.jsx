import { Box, Typography, IconButton, Paper, Skeleton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useRef } from "react";
import { useTheme } from "@mui/material/styles";
import EventCard from "./EventCard";

const HorizontalEventsSection = ({
    title,
    events,
    loading = false,
    icon = null,
    onViewAll = null,
    viewAllLabel = "Voir tout"
}) => {
    const theme = useTheme();
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 320; // Width of one event card + spacing
            const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Don't render the section if no events and not loading
    if (!loading && (!events || events.length === 0)) {
        return null;
    }

    return (
        <Box sx={{ mb: 6 }}>
            {/* Section Header */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3
            }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    {icon && (
                        <Box sx={{ mr: 1, color: "primary.main" }}>
                            {icon}
                        </Box>
                    )}
                    <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                        {title}
                    </Typography>
                </Box>

                {onViewAll && !loading && events && events.length > 0 && (
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" }
                        }}
                        onClick={onViewAll}
                    >
                        {viewAllLabel}
                    </Typography>
                )}
            </Box>

            {/* Scrollable Events Container */}
            <Box sx={{ position: "relative" }}>
                {/* Left Arrow */}
                <IconButton
                    sx={{
                        position: "absolute",
                        left: -20,
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "background.paper",
                        boxShadow: 1,
                        zIndex: 2,
                        "&:hover": {
                            backgroundColor: "background.paper",
                            boxShadow: 2,
                        },
                    }}
                    onClick={() => scroll('left')}
                >
                    <ChevronLeft />
                </IconButton>

                {/* Right Arrow */}
                <IconButton
                    sx={{
                        position: "absolute",
                        right: -20,
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "background.paper",
                        boxShadow: 1,
                        zIndex: 2,
                        "&:hover": {
                            backgroundColor: "background.paper",
                            boxShadow: 2,
                        },
                    }}
                    onClick={() => scroll('right')}
                >
                    <ChevronRight />
                </IconButton>

                {/* Events Scroll Container */}
                <Box
                    ref={scrollRef}
                    sx={{
                        display: "flex",
                        gap: 3,
                        overflowX: "auto",
                        scrollbarWidth: "none", // Firefox
                        "&::-webkit-scrollbar": {
                            display: "none", // Chrome/Safari
                        },
                        pb: 2, // Padding for shadows
                        px: 1, // Padding to prevent clipping
                    }}
                >
                    {loading ? (
                        // Loading skeletons
                        Array.from({ length: 6 }).map((_, index) => (
                            <Paper
                                key={index}
                                sx={{
                                    minWidth: 300,
                                    height: 400,
                                    flexShrink: 0,
                                    borderRadius: 0,
                                }}
                            >
                                <Skeleton variant="rectangular" width="100%" height={200} />
                                <Box sx={{ p: 2 }}>
                                    <Skeleton variant="text" height={32} width="80%" />
                                    <Skeleton variant="text" height={20} width="100%" />
                                    <Skeleton variant="text" height={20} width="60%" />
                                    <Box sx={{ mt: 2 }}>
                                        <Skeleton variant="text" height={20} width="40%" />
                                        <Skeleton variant="text" height={20} width="50%" />
                                    </Box>
                                </Box>
                            </Paper>
                        ))
                    ) : (
                        // Event cards
                        events?.map((event) => (
                            <Box
                                key={event.id}
                                sx={{
                                    minWidth: 300,
                                    flexShrink: 0,
                                }}
                            >
                                <EventCard event={event} />
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default HorizontalEventsSection;
