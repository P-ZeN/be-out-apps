import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Alert,
    Grid,
    Paper,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Chip,
} from "@mui/material";
import { AccountCircle, Home, Phone, LocationOn } from "@mui/icons-material";
import { apiPost, apiGet, apiPut } from "../utils/apiUtils";
import { formatDateForInput, formatDateForServer } from "../utils/dateUtils";

const Onboarding = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [addressLoading, setAddressLoading] = useState(false);

    // Form data - includes all fields for personal info and address
    const [formData, setFormData] = useState({
        // Personal information
        firstName: "",
        lastName: "",
        phone: "",
        dateOfBirth: "",

        // Address information following international standards
        addressLine1: "",
        addressLine2: "",
        locality: "",
        administrativeArea: "",
        postalCode: "",
        countryCode: "FR",
        addressType: "home",
        addressLabel: "Home Address",
    });

    const { user, updateUser, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(["onboarding", "common"]);

    // Country options with ISO codes
    const countryOptions = [
        { code: "FR", name: "France" },
        { code: "BE", name: "Belgium" },
        { code: "CH", name: "Switzerland" },
        { code: "DE", name: "Germany" },
        { code: "ES", name: "Spain" },
        { code: "IT", name: "Italy" },
        { code: "GB", name: "United Kingdom" },
        { code: "US", name: "United States" },
        { code: "CA", name: "Canada" },
    ];

    // All steps are always visible
    const steps = [
        {
            label: t("steps.personal.label", { ns: "onboarding" }),
            icon: <AccountCircle />,
            fields: ["firstName", "lastName", "phone", "dateOfBirth"],
            id: "personal",
        },
        {
            label: t("steps.address.label", { ns: "onboarding" }),
            icon: <LocationOn />,
            fields: ["addressLine1", "locality", "postalCode", "countryCode"],
            id: "address",
        },
    ];

    // Load existing profile data and pre-fill form
    useEffect(() => {
        const loadUserData = async () => {
            if (user && user.id) {
                // Load user profile data
                setFormData((prevData) => ({
                    ...prevData,
                    firstName: user.first_name || "",
                    lastName: user.last_name || "",
                    phone: user.phone || "",
                    dateOfBirth: formatDateForInput(user.date_of_birth) || "",
                }));

                // Load existing address if any - try multiple approaches
                try {
                    // First try to get primary address
                    const primaryAddress = await apiGet(`/api/users/${user.id}/primary-address`);
                    if (primaryAddress) {
                        setFormData((prevData) => ({
                            ...prevData,
                            addressLine1: primaryAddress.address_line_1 || "",
                            addressLine2: primaryAddress.address_line_2 || "",
                            locality: primaryAddress.locality || "",
                            administrativeArea: primaryAddress.administrative_area || "",
                            postalCode: primaryAddress.postal_code || "",
                            countryCode: primaryAddress.country_code || "FR",
                            addressLabel: primaryAddress.label || "Home Address",
                        }));
                    }
                } catch (primaryError) {
                    // If primary address fails, try to get any address for this user
                    try {
                        const addresses = await apiGet(`/api/users/${user.id}/addresses`);
                        if (addresses && addresses.length > 0) {
                            const address =
                                addresses.find((addr) => addr.is_primary || addr.relationship_type === "primary") ||
                                addresses[0];
                            setFormData((prevData) => ({
                                ...prevData,
                                addressLine1: address.address_line_1 || "",
                                addressLine2: address.address_line_2 || "",
                                locality: address.locality || "",
                                administrativeArea: address.administrative_area || "",
                                postalCode: address.postal_code || "",
                                countryCode: address.country_code || "FR",
                                addressLabel: address.label || "Home Address",
                            }));
                        }
                    } catch (allAddressesError) {
                        // Neither endpoint worked - this is fine for new users or users with no addresses
                        console.info("No existing addresses found - user can enter new address");
                    }
                }
            }
        };

        loadUserData();
    }, [user]);

    // Address autocomplete functionality
    const handleAddressSearch = async (searchText) => {
        if (searchText.length < 3) {
            setAddressSuggestions([]);
            return;
        }

        setAddressLoading(true);
        try {
            // This would integrate with a geocoding service like Google Places API
            // For now, we'll simulate with a local search
            const response = await apiGet(
                `/api/geocoding/search?q=${encodeURIComponent(searchText)}&country=${formData.countryCode}`
            );
            setAddressSuggestions(response.suggestions || []);
        } catch (error) {
            console.warn("Address search failed:", error);
            setAddressSuggestions([]);
        } finally {
            setAddressLoading(false);
        }
    };

    const handleAddressSelect = (selectedAddress) => {
        if (selectedAddress) {
            setFormData((prevData) => ({
                ...prevData,
                addressLine1: selectedAddress.address_line_1 || "",
                addressLine2: selectedAddress.address_line_2 || "",
                locality: selectedAddress.locality || "",
                administrativeArea: selectedAddress.administrative_area || "",
                postalCode: selectedAddress.postal_code || "",
                countryCode: selectedAddress.country_code || prevData.countryCode,
            }));
        }
    };

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData({
            ...formData,
            [field]: value,
        });

        // Trigger address search for address line 1
        if (field === "addressLine1") {
            handleAddressSearch(value);
        }
    };

    const validateStep = (stepIndex) => {
        const currentStep = steps[stepIndex];
        return currentStep.fields.every((field) => {
            return formData[field] && formData[field].trim() !== "";
        });
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevStep) => prevStep + 1);
            setError("");
        } else {
            setError(t("errors.fillFields", { ns: "onboarding" }));
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setError("");
    };

    const completeOnboarding = async () => {
        setLoading(true);
        setError("");

        try {
            // Robust address handling - try multiple approaches
            let addressResponse;
            let addressCreated = false;

            // Try to get existing primary address first
            try {
                const existingAddress = await apiGet(`/api/users/${user.id}/primary-address`);

                // User has an existing primary address, update it
                const addressData = {
                    address_line_1: formData.addressLine1,
                    address_line_2: formData.addressLine2 || null,
                    locality: formData.locality,
                    administrative_area: formData.administrativeArea || null,
                    postal_code: formData.postalCode || null,
                    country_code: formData.countryCode,
                    address_type: formData.addressType,
                    label: formData.addressLabel,
                    is_primary: true,
                };

                addressResponse = await apiPut(`/api/addresses/${existingAddress.id}`, addressData);
                console.log("Updated existing primary address");
            } catch (primaryError) {
                // No primary address found, try to get any user address
                try {
                    const addresses = await apiGet(`/api/users/${user.id}/addresses`);
                    if (addresses && addresses.length > 0) {
                        // User has addresses but no primary - update the first one and make it primary
                        const firstAddress = addresses[0];
                        const addressData = {
                            address_line_1: formData.addressLine1,
                            address_line_2: formData.addressLine2 || null,
                            locality: formData.locality,
                            administrative_area: formData.administrativeArea || null,
                            postal_code: formData.postalCode || null,
                            country_code: formData.countryCode,
                            address_type: formData.addressType,
                            label: formData.addressLabel,
                            is_primary: true,
                        };

                        addressResponse = await apiPut(`/api/addresses/${firstAddress.id}`, addressData);
                        console.log("Updated existing address and made it primary");
                    } else {
                        // No addresses at all - create new one
                        throw new Error("No addresses found, will create new one");
                    }
                } catch (allAddressesError) {
                    // User has no addresses at all - create new address and relationship
                    const addressData = {
                        address_line_1: formData.addressLine1,
                        address_line_2: formData.addressLine2 || null,
                        locality: formData.locality,
                        administrative_area: formData.administrativeArea || null,
                        postal_code: formData.postalCode || null,
                        country_code: formData.countryCode,
                        address_type: formData.addressType,
                        label: formData.addressLabel,
                        is_primary: true,
                    };

                    addressResponse = await apiPost("/api/addresses", addressData);
                    addressCreated = true;
                    console.log("Created new address");
                }
            }

            // If we created a new address, we need to create the relationship
            if (addressCreated && addressResponse && addressResponse.id) {
                try {
                    await apiPost("/api/address-relationships", {
                        address_id: addressResponse.id,
                        entity_type: "user",
                        entity_id: user.id,
                        relationship_type: "primary",
                    });
                    console.log("Created address relationship");
                } catch (relationshipError) {
                    console.warn("Address created but relationship creation failed:", relationshipError);
                    // Don't fail the entire onboarding - the address exists, relationship can be fixed later
                }
            }

            // Continue with profile update regardless of address success/failure
            let profileUpdateSuccess = false;
            try {
                const profileData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    dateOfBirth: formatDateForServer(formData.dateOfBirth),
                    // Save current language preference during onboarding
                    preferred_language: i18n.language || 'fr'
                };

                console.log("Sending profile data to server:", profileData);
                const profileResponse = await apiPost("/api/user/complete-onboarding", profileData);
                console.log("Profile updated successfully:", profileResponse);
                profileUpdateSuccess = true;
            } catch (profileError) {
                console.error("Profile update failed:", profileError);

                // Check if this is a critical error that should stop onboarding
                if (profileError.message && profileError.message.includes("401")) {
                    throw new Error("Authentication expired. Please log in again.");
                } else if (profileError.message && profileError.message.includes("400")) {
                    throw new Error("Invalid profile data. Please check all required fields.");
                } else {
                    console.warn("Profile update failed but continuing onboarding - user can update profile later");
                    // Don't fail onboarding completely for non-critical errors
                }
            }

            // Update user state in AuthContext
            const updatedUser = {
                ...user,
                onboarding_complete: true,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                date_of_birth: formData.dateOfBirth,
            };

            console.log("Updating user state with:", updatedUser);
            updateUser(updatedUser);

            const successMessage = profileUpdateSuccess
                ? t("success.completed", { ns: "onboarding" })
                : "Onboarding completed with some non-critical issues. You can update your profile later.";

            setSuccess(successMessage);

            // Redirect to dashboard after a brief delay
            console.log("Onboarding completed successfully, redirecting to dashboard...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
        } catch (error) {
            console.error("Onboarding error:", error);

            // Provide user-friendly error messages
            let errorMessage = t("errors.failed", { ns: "onboarding" });

            if (error.message.includes("401") || error.message.includes("403")) {
                errorMessage = "Authentication failed. Please try logging in again.";
            } else if (error.message.includes("network") || error.message.includes("fetch")) {
                errorMessage = "Network error. Please check your connection and try again.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) {
            setError(t("errors.fillFields", { ns: "onboarding" }));
            return;
        }

        await completeOnboarding();
    };

    const renderStepContent = (stepIndex) => {
        const currentStep = steps[stepIndex];

        switch (currentStep.id) {
            case "personal":
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                {t("steps.personal.title", { ns: "onboarding" })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t("steps.personal.description", { ns: "onboarding" })}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.firstName", { ns: "onboarding" })}
                                value={formData.firstName}
                                onChange={handleInputChange("firstName")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.lastName", { ns: "onboarding" })}
                                value={formData.lastName}
                                onChange={handleInputChange("lastName")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.phone", { ns: "onboarding" })}
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange("phone")}
                                placeholder="+33 1 23 45 67 89"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.dateOfBirth", { ns: "onboarding" })}
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange("dateOfBirth")}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    </Grid>
                );

            case "address":
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                {t("steps.address.title", { ns: "onboarding" })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t("steps.address.description", { ns: "onboarding" })}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t("fields.country", { ns: "onboarding" })}</InputLabel>
                                <Select
                                    value={formData.countryCode}
                                    onChange={handleInputChange("countryCode")}
                                    label={t("fields.country", { ns: "onboarding" })}>
                                    {countryOptions.map((country) => (
                                        <MenuItem key={country.code} value={country.code}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <span>{country.code}</span>
                                                <span>{country.name}</span>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                freeSolo
                                options={addressSuggestions}
                                loading={addressLoading}
                                getOptionLabel={(option) =>
                                    typeof option === "string"
                                        ? option
                                        : option.formatted_address || option.address_line_1
                                }
                                onInputChange={(event, newInputValue) => {
                                    setFormData((prev) => ({ ...prev, addressLine1: newInputValue }));
                                    handleAddressSearch(newInputValue);
                                }}
                                onChange={(event, newValue) => handleAddressSelect(newValue)}
                                value={formData.addressLine1}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        fullWidth
                                        label={t("fields.addressLine1", { ns: "onboarding" })}
                                        placeholder="123 Rue de la Paix"
                                        helperText={t("fields.addressLine1Help", { ns: "onboarding" })}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <li key={key} {...otherProps}>
                                            <Box>
                                                <Typography variant="body1">
                                                    {option.formatted_address || option.address_line_1}
                                                </Typography>
                                                {option.locality && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {option.locality}, {option.country_code}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label={t("fields.addressLine2", { ns: "onboarding" })}
                                value={formData.addressLine2}
                                onChange={handleInputChange("addressLine2")}
                                placeholder="Appartement, étage, bâtiment..."
                                helperText={t("fields.addressLine2Help", { ns: "onboarding" })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.city", { ns: "onboarding" })}
                                value={formData.locality}
                                onChange={handleInputChange("locality")}
                                placeholder="Paris"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("fields.administrativeArea", { ns: "onboarding" })}
                                value={formData.administrativeArea}
                                onChange={handleInputChange("administrativeArea")}
                                placeholder="Île-de-France"
                                helperText={t("fields.administrativeAreaHelp", { ns: "onboarding" })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label={t("fields.postalCode", { ns: "onboarding" })}
                                value={formData.postalCode}
                                onChange={handleInputChange("postalCode")}
                                placeholder="75001"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("fields.addressLabel", { ns: "onboarding" })}
                                value={formData.addressLabel}
                                onChange={handleInputChange("addressLabel")}
                                placeholder="Home Address"
                                helperText={t("fields.addressLabelHelp", { ns: "onboarding" })}
                            />
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    // Show loading while auth is loading
    if (authLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4, mb: 4, textAlign: "center" }}>
                    <Typography variant="h6">{t("common.loading")}</Typography>
                </Box>
            </Container>
        );
    }

    // Redirect if user is already onboarded
    if (user && user.onboarding_complete) {
        navigate("/");
        return null;
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    {t("welcome", { ns: "onboarding" })}
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                    {t("description", { ns: "onboarding" })}
                </Typography>

                <Paper elevation={3} sx={{ p: 4 }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((step, index) => (
                            <Step key={step.id}>
                                <StepLabel icon={step.icon}>{step.label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {success ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    ) : (
                        <>
                            {renderStepContent(activeStep)}

                            {error && (
                                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                                <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                                    {t("back", { ns: "common" })}
                                </Button>

                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Button onClick={logout} variant="text" color="error">
                                        {t("logout", { ns: "common" })}
                                    </Button>

                                    {activeStep === steps.length - 1 ? (
                                        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                                            {loading
                                                ? t("completing", { ns: "onboarding" })
                                                : t("complete", { ns: "onboarding" })}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleNext} variant="contained">
                                            {t("next", { ns: "common" })}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Onboarding;
