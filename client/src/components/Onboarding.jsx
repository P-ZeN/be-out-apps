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
} from "@mui/material";
import { AccountCircle, Home, Phone } from "@mui/icons-material";
import { apiPost } from "../utils/apiUtils";
import { formatDateForInput, formatDateForServer } from "../utils/dateUtils";

const Onboarding = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form data - always includes all fields
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        dateOfBirth: "",
        streetNumber: "",
        streetName: "",
        postalCode: "",
        city: "",
        country: "France",
    });

    const { user, updateUser, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(["auth", "common"]);

    // All steps are always visible
    const steps = [
        {
            label: "Personal Information",
            icon: <AccountCircle />,
            fields: ["firstName", "lastName", "phone", "dateOfBirth"],
            id: "personal",
        },
        {
            label: "Address",
            icon: <Home />,
            fields: ["streetNumber", "streetName", "postalCode", "city", "country"],
            id: "address",
        },
    ];

    // Load existing profile data and pre-fill form
    useEffect(() => {
        if (user && user.id) {
            setFormData({
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                phone: user.phone || "",
                dateOfBirth: formatDateForInput(user.date_of_birth) || "",
                streetNumber: user.street_number || "",
                streetName: user.street_name || "",
                postalCode: user.postal_code || "",
                city: user.city || "",
                country: user.country || "France",
            });
        }
    }, [user]);

    const handleInputChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.target.value,
        });
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
            setError("Please fill in all required fields");
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
            // Format data for server
            const serverData = {
                ...formData,
                dateOfBirth: formatDateForServer(formData.dateOfBirth),
            };

            await apiPost("/api/user/complete-onboarding", serverData);

            // Update user state in AuthContext to include onboarding_complete: true
            const updatedUser = {
                ...user,
                onboarding_complete: true,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                date_of_birth: formData.dateOfBirth,
                street_number: formData.streetNumber,
                street_name: formData.streetName,
                postal_code: formData.postalCode,
                city: formData.city,
                country: formData.country,
            };

            updateUser(updatedUser);
            setSuccess("Onboarding completed successfully!");

            // Redirect to home after a brief delay
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            console.error("Onboarding error:", error);
            setError("Failed to complete onboarding. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) {
            setError("Please fill in all required fields");
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
                                Personal Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Please complete your personal details
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={handleInputChange("firstName")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleInputChange("lastName")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label="Phone Number"
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
                                label="Date of Birth"
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
                                Your Address
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                This helps us show you nearby events
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                            <TextField
                                required
                                fullWidth
                                label="Number"
                                value={formData.streetNumber}
                                onChange={handleInputChange("streetNumber")}
                                placeholder="123"
                            />
                        </Grid>
                        <Grid size={{ xs: 9 }}>
                            <TextField
                                required
                                fullWidth
                                label="Street Name"
                                value={formData.streetName}
                                onChange={handleInputChange("streetName")}
                                placeholder="Rue de la Paix"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label="Postal Code"
                                value={formData.postalCode}
                                onChange={handleInputChange("postalCode")}
                                placeholder="75001"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                label="City"
                                value={formData.city}
                                onChange={handleInputChange("city")}
                                placeholder="Paris"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                required
                                fullWidth
                                label="Country"
                                value={formData.country}
                                onChange={handleInputChange("country")}
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
                    <Typography variant="h6">Authenticating...</Typography>
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
                    Welcome to Be-Out! 🎉
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                    Let's set up your profile to get started
                </Typography>

                <Paper elevation={3} sx={{ p: 4 }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((step, index) => (
                            <Step key={step.id}>
                                <StepLabel>{step.label}</StepLabel>
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
                                    Back
                                </Button>

                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Button onClick={logout} variant="text" color="error">
                                        Logout
                                    </Button>

                                    {activeStep === steps.length - 1 ? (
                                        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                                            {loading ? "Completing..." : "Complete Setup"}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleNext} variant="contained">
                                            Next
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
