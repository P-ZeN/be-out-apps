import { useState, useEffect, useRef } from "react";
import {
    TextField,
    InputAdornment,
    IconButton,
    Autocomplete,
    Paper,
    Box,
    Typography,
    CircularProgress,
} from "@mui/material";
import { Search, MyLocation, LocationOn } from "@mui/icons-material";
import { GeocodingService } from "../services/geocodingService";
import { useDebounce } from "../hooks/useDebounce";

const AddressSearch = ({
    onLocationSelect,
    onCurrentLocation,
    placeholder = "Rechercher par lieu ou adresse...",
    sx = {},
}) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const debouncedSearchTerm = useDebounce(inputValue, 300);
    const searchController = useRef(null);

    // Search for places when debounced input changes
    useEffect(() => {
        const searchPlaces = async () => {
            if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
                setOptions([]);
                return;
            }

            // Cancel previous request
            if (searchController.current) {
                searchController.current.abort();
            }

            setLoading(true);
            try {
                const results = await GeocodingService.searchPlaces(debouncedSearchTerm);
                setOptions(results);
            } catch (error) {
                console.error("Search error:", error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        searchPlaces();

        return () => {
            if (searchController.current) {
                searchController.current.abort();
            }
        };
    }, [debouncedSearchTerm]);

    const handleLocationSelect = (event, value) => {
        if (value && onLocationSelect) {
            onLocationSelect({
                latitude: value.center[1],
                longitude: value.center[0],
                address: value.place_name,
                bbox: value.bbox,
            });
        }
    };

    const handleCurrentLocation = async () => {
        setIsGettingLocation(true);
        try {
            const location = await GeocodingService.getCurrentLocation();
            if (onCurrentLocation) {
                onCurrentLocation(location);
            }
            if (onLocationSelect) {
                onLocationSelect(location);
            }
        } catch (error) {
            console.error("Error getting current location:", error);
            // You might want to show a toast or error message here
        } finally {
            setIsGettingLocation(false);
        }
    };

    const renderOption = (props, option) => (
        <Box component="li" {...props} key={option.id}>
            <LocationOn sx={{ mr: 2, color: "text.secondary" }} />
            <Box>
                <Typography variant="body2">{option.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {option.place_name}
                </Typography>
            </Box>
        </Box>
    );

    const getOptionLabel = (option) => {
        return typeof option === "string" ? option : option.place_name || "";
    };

    return (
        <Autocomplete
            freeSolo
            options={options}
            loading={loading}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={handleLocationSelect}
            getOptionLabel={getOptionLabel}
            renderOption={renderOption}
            filterOptions={(x) => x} // Don't filter, we handle this server-side
            PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={8}>
                    {children}
                </Paper>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    placeholder={placeholder}
                    sx={{ ...sx }}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleCurrentLocation}
                                    disabled={isGettingLocation}
                                    title="Utiliser ma position actuelle">
                                    {isGettingLocation ? <CircularProgress size={20} /> : <MyLocation />}
                                </IconButton>
                                {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                            </InputAdornment>
                        ),
                    }}
                />
            )}
            noOptionsText={inputValue.length < 3 ? "Tapez au moins 3 caractères..." : "Aucun résultat trouvé"}
        />
    );
};

export default AddressSearch;
