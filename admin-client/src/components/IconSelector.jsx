import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Tabs,
    Tab,
    IconButton,
    Typography,
    Chip,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
import IconRenderer from "./IconRenderer";

// Popular Material-UI icons for events
const POPULAR_ICONS = [
    "Event",
    "EventNote",
    "EventAvailable",
    "EventBusy",
    "EventSeat",
    "MusicNote",
    "TheaterComedy",
    "SportsEsports",
    "Restaurant",
    "LocalActivity",
    "Celebration",
    "Sports",
    "Business",
    "School",
    "FitnessCenter",
    "LocalHospital",
    "ShoppingCart",
    "Movie",
    "ArtTrack",
    "LibraryBooks",
    "Computer",
    "Work",
    "Groups",
    "Favorite",
    "Star",
    "Coffee",
    "LocalBar",
    "LocalCafe",
    "BeachAccess",
    "NaturePeople",
    "Hiking",
    "DirectionsBike",
    "Pool",
    "Flight",
    "Train",
    "DirectionsCar",
    "SportsMotorsports",
    "Sailing",
    "SportsBaseball",
    "SportsBasketball",
    "SportsFootball",
    "SportsTennis",
    "SportsVolleyball",
    "SportsSoccer",
    "SportsGolf",
    "SportsHockey",
    "Fastfood",
    "LocalDining",
    "Nightlife",
    "Weekend",
    "CameraAlt",
    "Palette",
    "Brush",
    "Build",
    "Code",
    "Science",
    "Biotech",
];

// Popular emoji categories for events
const POPULAR_EMOJIS = {
    "Musique & Arts": ["🎵", "🎶", "🎼", "🎤", "🎸", "🎹", "🎺", "🎻", "🎨", "🎭", "🎪", "🎬", "📚", "✍️"],
    "Sports & Fitness": ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🥊", "🏋️", "🚴", "🏃", "🧘", "🤸"],
    "Nourriture & Boissons": ["🍕", "🍔", "🍟", "🌭", "🥗", "🍣", "🍜", "🍰", "☕", "🍷", "🍺", "🥂", "🍸", "🧊"],
    "Voyages & Nature": ["✈️", "🚗", "🚲", "🏖️", "🏔️", "🌲", "🌸", "🌞", "🌙", "⭐", "🏕️", "🗺️", "📍", "🧭"],
    "Technologie & Business": ["💻", "📱", "🖥️", "💡", "🔧", "📊", "💼", "🏢", "💰", "📈", "🎯", "⚙️", "🚀", "💾"],
    Divertissement: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍾", "🎆", "🎇", "🎮", "🎲", "🃏", "🎳", "🎯"],
    "Famille & Social": ["👨‍👩‍👧‍👦", "👶", "🧒", "👦", "👧", "💑", "💍", "👥", "🤝", "💝", "❤️", "💕", "😊", "🎓"],
};

const IconSelector = ({ value, onChange, onClose, open }) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [customIcon, setCustomIcon] = useState(value || "");

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleIconSelect = (iconName) => {
        onChange(iconName);
        onClose();
    };

    const handleCustomIconSubmit = () => {
        onChange(customIcon);
        onClose();
    };

    // Filter popular icons based on search term
    const filteredIcons = POPULAR_ICONS.filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    Sélectionner une icône
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                    <Tab label="Icônes Material-UI" />
                    <Tab label="Emojis" />
                    <Tab label="Personnalisé" />
                </Tabs>

                {/* Material-UI Icons Tab */}
                {selectedTab === 0 && (
                    <Box>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Rechercher une icône..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                            <Grid container spacing={1}>
                                {filteredIcons.map((iconName) => (
                                    <Grid size={{ xs: 3, sm: 2, md: 1.5 }} key={iconName}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleIconSelect(iconName)}
                                            sx={{
                                                width: "100%",
                                                minHeight: 90,
                                                maxHeight: 90,
                                                flexDirection: "column",
                                                p: 1,
                                                fontSize: "0.65rem",
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}>
                                            <IconRenderer
                                                iconName={iconName}
                                                sx={{ mb: 0.5, flexShrink: 0, fontSize: "1.8rem" }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontSize: "0.65rem",
                                                    lineHeight: "0.9",
                                                    textAlign: "center",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    wordBreak: "break-word",
                                                    hyphens: "auto",
                                                }}>
                                                {iconName.replace(/([A-Z])/g, " $1").trim()}
                                            </Typography>
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                )}

                {/* Emojis Tab */}
                {selectedTab === 1 && (
                    <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                        {Object.entries(POPULAR_EMOJIS).map(([category, emojis]) => (
                            <Box key={category} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                    {category}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {emojis.map((emoji) => (
                                        <Chip
                                            key={emoji}
                                            label={emoji}
                                            onClick={() => handleIconSelect(emoji)}
                                            sx={{
                                                fontSize: "1.2em",
                                                cursor: "pointer",
                                                "&:hover": { backgroundColor: "primary.light" },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Custom Icon Tab */}
                {selectedTab === 2 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Saisissez le nom d'une icône Material-UI (ex: "MusicNote") ou un emoji
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Nom de l'icône ou emoji"
                                value={customIcon}
                                onChange={(e) => setCustomIcon(e.target.value)}
                                placeholder="MusicNote, Event, 🎵, etc."
                            />
                            <Box sx={{ minWidth: 60, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Aperçu:
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <IconRenderer iconName={customIcon} />
                                </Box>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleCustomIconSubmit}
                            disabled={!customIcon.trim()}
                            fullWidth>
                            Utiliser cette icône
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default IconSelector;
