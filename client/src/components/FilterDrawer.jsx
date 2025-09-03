import {
    Box,
    Drawer,
    Typography,
    Button,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Divider,
    Switch,
    FormControlLabel,
    TextField,
    IconButton,
} from "@mui/material";
import { Close, FilterList } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FilterDrawer = ({ open, onClose, filters, onFiltersChange, categories = [] }) => {
    const { t } = useTranslation(["home", "common"]);
    const [localFilters, setLocalFilters] = useState(filters);

    // Fallback categories if none provided
    const defaultCategories = [
        { key: "music", label: t("home:categories.music") },
        { key: "sport", label: t("home:categories.sport") },
        { key: "theater", label: t("home:categories.theater") },
        { key: "food", label: t("home:categories.food") },
    ];

    // Use provided categories or fallback to defaults
    const categoryOptions = categories.length > 0 ? categories : defaultCategories;

    const sortOptions = [
        { key: "date", label: t("home:filters.sortOptions.date") },
        { key: "price", label: t("home:filters.sortOptions.price") },
        { key: "distance", label: t("home:filters.sortOptions.distance") },
        { key: "popularity", label: t("home:filters.sortOptions.popularity") },
    ];

    const handlePriceChange = (event, newValue) => {
        setLocalFilters({
            ...localFilters,
            priceRange: newValue,
        });
    };

    const handleCategoryChange = (category) => {
        const updatedCategories = localFilters.categories.includes(category)
            ? localFilters.categories.filter((c) => c !== category)
            : [...localFilters.categories, category];

        setLocalFilters({
            ...localFilters,
            categories: updatedCategories,
        });
    };

    const handleSortChange = (event) => {
        setLocalFilters({
            ...localFilters,
            sortBy: event.target.value,
        });
    };

    const handleDistanceChange = (event, newValue) => {
        setLocalFilters({
            ...localFilters,
            maxDistance: newValue,
        });
    };

    const handleApplyFilters = () => {
        onFiltersChange(localFilters);
        onClose();
    };

    const handleResetFilters = () => {
        const resetFilters = {
            priceRange: [0, 100],
            categories: [],
            sortBy: "date",
            maxDistance: 50,
            lastMinuteOnly: false,
            availableOnly: true,
        };
        setLocalFilters(resetFilters);
        onFiltersChange(resetFilters);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                "& .MuiDrawer-paper": {
                    width: { xs: "100%", sm: 400 },
                    p: 3,
                },
            }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    <FilterList sx={{ mr: 1, verticalAlign: "middle" }} />
                    {t("home:filters.title")}
                </Typography>
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </Box>

            {/* Sort By */}
            <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>{t("home:filters.sortBy")}</InputLabel>
                    <Select value={localFilters.sortBy} label={t("home:filters.sortBy")} onChange={handleSortChange}>
                        {sortOptions.map((option) => (
                            <MenuItem key={option.key} value={option.key}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Price Range */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
                    {t("home:filters.priceRange")}
                </Typography>
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={localFilters.priceRange}
                        onChange={handlePriceChange}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}€`}
                        min={0}
                        max={200}
                        marks={[
                            { value: 0, label: "0€" },
                            { value: 50, label: "50€" },
                            { value: 100, label: "100€" },
                            { value: 200, label: "200€" },
                        ]}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                    {t("home:filters.priceDisplay", { min: localFilters.priceRange[0], max: localFilters.priceRange[1] })}
                </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Categories */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
                    {t("home:filters.categories")}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {categoryOptions.map((category) => (
                        <Chip
                            key={category.key}
                            label={category.label}
                            onClick={() => handleCategoryChange(category.key)}
                            color={localFilters.categories.includes(category.key) ? "primary" : "default"}
                            variant={localFilters.categories.includes(category.key) ? "filled" : "outlined"}
                            clickable
                        />
                    ))}
                </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Distance */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
                    {t("home:filters.maxDistance")}
                </Typography>
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={localFilters.maxDistance}
                        onChange={handleDistanceChange}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value} km`}
                        min={1}
                        max={100}
                        marks={[
                            { value: 1, label: "1km" },
                            { value: 10, label: "10km" },
                            { value: 50, label: "50km" },
                            { value: 100, label: "100km" },
                        ]}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                    {t("home:filters.distanceDisplay", { distance: localFilters.maxDistance })}
                </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Additional Options */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
                    {t("home:filters.options")}
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={localFilters.lastMinuteOnly}
                            onChange={(e) =>
                                setLocalFilters({
                                    ...localFilters,
                                    lastMinuteOnly: e.target.checked,
                                })
                            }
                        />
                    }
                    label={t("home:filters.lastMinuteOnly")}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={localFilters.availableOnly}
                            onChange={(e) =>
                                setLocalFilters({
                                    ...localFilters,
                                    availableOnly: e.target.checked,
                                })
                            }
                        />
                    }
                    label={t("home:filters.availableOnly")}
                />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: "auto" }}>
                <Stack spacing={2}>
                    <Button variant="contained" fullWidth onClick={handleApplyFilters} size="large">
                        {t("home:filters.applyFilters")}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={handleResetFilters}>
                        {t("home:filters.resetFilters")}
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
};

export default FilterDrawer;
