import React, { useState } from "react";
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
} from "@mui/material";
import {
    Event,
    LocationOn,
    ConfirmationNumber,
    Publish,
    Save,
    ArrowBack,
    ArrowForward,
    Check,
} from "@mui/icons-material";

const EventFormStepper = ({
    activeStep,
    onStepChange,
    formData,
    onComplete,
    onSave,
    loading = false,
    children
}) => {
    const steps = [
        {
            label: "Détails de l'événement",
            icon: <Event />,
            description: "Informations générales"
        },
        {
            label: "Lieu et adresse",
            icon: <LocationOn />,
            description: "Localisation de l'événement"
        },
        {
            label: "Billetterie et design",
            icon: <ConfirmationNumber />,
            description: "Tarifs et tickets personnalisés"
        },
        {
            label: "Publication",
            icon: <Publish />,
            description: "Révision finale et publication"
        }
    ];

    const currentStep = steps[activeStep];
    const isLastStep = activeStep === steps.length - 1;
    const isFirstStep = activeStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            onStepChange(activeStep + 1);
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            onStepChange(activeStep - 1);
        }
    };

    const handleStepClick = (stepIndex) => {
        onStepChange(stepIndex);
    };

    return (
        <Box>
            {/* Header with Step Info */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {currentStep.icon}
                    <Typography variant="h4" fontWeight="bold">
                        {currentStep.label}
                    </Typography>
                </Box>
            </Box>

            {/* Step Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {currentStep.description}
            </Typography>

            {/* Stepper Navigation */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                        sx={{ mb: 2 }}
                    >
                        {steps.map((step, index) => (
                            <Step
                                key={step.label}
                                sx={{ cursor: "pointer" }}
                                onClick={() => handleStepClick(index)}
                            >
                                <StepLabel
                                icon={
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            backgroundColor: index <= activeStep ? "primary.main" : "grey.300",
                                            color: index <= activeStep ? "white" : "grey.600",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.3s ease",
                                            border: index === activeStep ? "3px solid" : "none",
                                            borderColor: index === activeStep ? "primary.light" : "transparent",
                                            position: "relative",
                                            top: "50%",
                                            transform: "translateY(-20%)",
                                        }}
                                    >
                                        {step.icon}
                                    </Box>
                                }
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    minHeight: 0,
                                    padding: 0,
                                }}
                                >
                                    <Typography variant="body2" fontWeight="medium">
                                        {step.label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Step Navigation Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={isFirstStep}
                            startIcon={<ArrowBack />}
                        >
                            Précédent
                        </Button>

                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                Étape {activeStep + 1} sur {steps.length}
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            {/* Save/Apply Changes button */}
                            <Button
                                variant="outlined"
                                onClick={onSave}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                            >
                                {loading ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>

                            {/* Next/Finish button */}
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                endIcon={isLastStep ? <Check /> : <ArrowForward />}
                            >
                                {isLastStep ? "Terminer" : "Suivant"}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Step Content */}
            <Grid container spacing={3}>
                {children}
            </Grid>
        </Box>
    );
};

export default EventFormStepper;
