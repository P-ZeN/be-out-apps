import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Box,
    Grid,
    Alert,
    CircularProgress,
} from "@mui/material";

import EventFormStepper from "./EventFormStepper";
import EventDetailsStep from "./steps/EventDetailsStep";
import VenueStep from "./steps/VenueStep";
import TicketDesignStep from "./steps/TicketDesignStep";
import PublicationStep from "./steps/PublicationStep";
import EventMobilePreview from "./EventMobilePreview";
import TicketPreview from "./ticket/TicketPreview";
import organizerService from "../services/organizerService";

const EventFormWizard = () => {
    const { id: paramEventId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Event state (can change during creation)
    const [currentEventId, setCurrentEventId] = useState(paramEventId);
    const [isCurrentlyEdit, setIsCurrentlyEdit] = useState(Boolean(paramEventId));

    const isEdit = Boolean(paramEventId); // For initial loading
    const eventId = paramEventId;

    // Wizard state
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Data state
    const [venues, setVenues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [ticketTemplates, setTicketTemplates] = useState([]);
    const [imagePreview, setImagePreview] = useState("");

    // Comprehensive form data for all steps
    const [formData, setFormData] = useState({
        // Step 1: Event Details
        eventDetails: {
            title: "",
            description: "",
            event_date: null,
            category_id: "",
            original_price: "",
            discounted_price: "",
            discount_percentage: 0,
            max_participants: "",
            tags: [],
            requirements: "",
            cancellation_policy: "",
            image: null,
        },

        // Step 2: Venue
        venue: {
            venue_id: "",
        },

        // Step 3: Ticket Design
        ticketConfig: {
            template_id: null,
            customizations: {},
            pricing_tiers: [],
            booking_settings: {
                booking_deadline: null,
                allow_multiple_bookings: false,
                max_bookings_per_user: 1,
            }
        },

        // Step 4: Publication
        publication: {
            is_published: false,
            request_review: false,
        },

        // Administrative data
        adminData: {
            status: "",
            moderation_status: "",
            admin_notes: "",
        }
    });

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load venues, categories, and ticket templates
                const [venuesData, categoriesData, templatesData] = await Promise.all([
                    organizerService.getVenues(),
                    organizerService.getCategories(),
                    // Gracefully handle missing ticket templates API
                    organizerService.getTicketTemplates?.()
                        .catch(() => {
                            console.warn('Ticket templates API not available yet');
                            return [];
                        }) || Promise.resolve([]),
                ]);

                setVenues(venuesData.venues || venuesData || []);
                setCategories(categoriesData.categories || categoriesData || []);
                setTicketTemplates(templatesData || []);

                // Load event data if editing
                if (isEdit) {
                    const eventData = await organizerService.getEvent(eventId);

                    setFormData({
                        eventDetails: {
                            title: eventData.title || "",
                            description: eventData.description || "",
                            event_date: eventData.event_date ? new Date(eventData.event_date) : null,
                            category_id: eventData.category_id || "",
                            original_price: eventData.original_price || eventData.price || "",
                            discounted_price: eventData.discounted_price || eventData.price || "",
                            discount_percentage: eventData.discount_percentage || 0,
                            max_participants: eventData.total_tickets || eventData.max_participants || "",
                            tags: eventData.tags || [],
                            requirements: eventData.requirements || "",
                            cancellation_policy: eventData.cancellation_policy || "",
                            image: null,
                        },
                        venue: {
                            venue_id: eventData.venue_id || "",
                        },
                        ticketConfig: {
                            template_id: eventData.ticket_template_id || null,
                            customizations: {},
                            pricing_tiers: [],
                            booking_settings: {
                                booking_deadline: eventData.booking_deadline ? new Date(eventData.booking_deadline) : null,
                                allow_multiple_bookings: false,
                                max_bookings_per_user: 1,
                            }
                        },
                        publication: {
                            is_published: eventData.is_published || false,
                            request_review: false,
                        },
                        adminData: {
                            id: eventData.id || "",
                            status: eventData.status || "",
                            moderation_status: eventData.moderation_status || "",
                            admin_notes: eventData.admin_notes || "",
                            is_published: eventData.is_published || false,
                            organizer_wants_published: eventData.organizer_wants_published !== undefined
                                ? eventData.organizer_wants_published
                                : eventData.is_published || false,
                        }
                    });

                    // Set image preview if event has an image
                    if (eventData.image_url) {
                        setImagePreview(eventData.image_url);
                    }
                }
            } catch (error) {
                setError(error.message || "Erreur lors du chargement des données");
            } finally {
                setInitialLoading(false);
            }
        };

        loadInitialData();
    }, [eventId, isEdit]);

    // Handle form data changes from steps
    const handleStepDataChange = (stepKey, stepData) => {
        setFormData(prev => ({
            ...prev,
            [stepKey]: {
                ...prev[stepKey],
                ...stepData
            }
        }));

        // Clear errors when user makes changes
        if (error) {
            setError("");
        }
    };

    // Handle step navigation
    const handleStepChange = (newStep) => {
        setActiveStep(newStep);
    };

    // Handle immediate publication actions
    const handleSubmitForReview = async () => {
        const targetEventId = currentEventId || eventId;
        if (!isCurrentlyEdit && !isEdit || !targetEventId) return;

        setLoading(true);
        setError("");
        try {
            await organizerService.submitEventForReview(targetEventId);
            setSuccess("Événement soumis pour révision avec succès !");
            // Reload event data to reflect new status
            const eventData = await organizerService.getEvent(targetEventId);
            setFormData(prev => ({
                ...prev,
                adminData: {
                    ...prev.adminData,
                    id: eventData.id,
                    status: eventData.status,
                    moderation_status: eventData.moderation_status,
                    admin_notes: eventData.admin_notes,
                    is_published: eventData.is_published,
                    organizer_wants_published: eventData.organizer_wants_published !== undefined
                        ? eventData.organizer_wants_published
                        : eventData.is_published,
                }
            }));
        } catch (err) {
            setError(err.message || "Erreur lors de la soumission pour révision");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublication = async () => {
        const targetEventId = currentEventId || eventId;
        if (!isCurrentlyEdit && !isEdit || !targetEventId) return;

        const currentWantsPublished = formData.adminData?.organizer_wants_published || false;
        const newWantsPublished = !currentWantsPublished;

        setLoading(true);
        setError("");
        try {
            await organizerService.toggleEventPublication(targetEventId, newWantsPublished);
            setSuccess(newWantsPublished ?
                "Événement marqué pour publication !" :
                "Événement retiré de la publication !");
            // Reload event data to reflect new status
            const eventData = await organizerService.getEvent(targetEventId);
            setFormData(prev => ({
                ...prev,
                adminData: {
                    ...prev.adminData,
                    id: eventData.id,
                    status: eventData.status,
                    moderation_status: eventData.moderation_status,
                    admin_notes: eventData.admin_notes,
                    is_published: eventData.is_published,
                    organizer_wants_published: eventData.organizer_wants_published !== undefined
                        ? eventData.organizer_wants_published
                        : eventData.is_published,
                }
            }));
        } catch (err) {
            setError(err.message || "Erreur lors du changement de statut de publication");
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async () => {
        const targetEventId = currentEventId || eventId;
        if (!isCurrentlyEdit && !isEdit || !targetEventId) return;

        setLoading(true);
        setError("");
        try {
            await organizerService.revertEventToDraft(targetEventId);
            setSuccess("Événement remis en brouillon avec succès !");
            // Reload event data to reflect new status
            const eventData = await organizerService.getEvent(targetEventId);
            setFormData(prev => ({
                ...prev,
                adminData: {
                    ...prev.adminData,
                    id: eventData.id,
                    status: eventData.status,
                    moderation_status: eventData.moderation_status,
                    admin_notes: eventData.admin_notes,
                    is_published: eventData.is_published,
                    organizer_wants_published: eventData.organizer_wants_published !== undefined
                        ? eventData.organizer_wants_published
                        : eventData.is_published,
                }
            }));
        } catch (err) {
            setError(err.message || "Erreur lors de la remise en brouillon");
        } finally {
            setLoading(false);
        }
    };

    // Handle saving changes without completing wizard
    const handleSaveChanges = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Combine all form data into event format
            const eventData = {
                ...formData.eventDetails,
                ...formData.venue,
                ...formData.publication,
                ticket_template_id: formData.ticketConfig.template_id,
                customizations: formData.ticketConfig.customizations,
                // Convert data types
                original_price: Number(formData.eventDetails.original_price) || 0,
                discounted_price: Number(formData.eventDetails.discounted_price) || 0,
                discount_percentage: Number(formData.eventDetails.discount_percentage) || 0,
                max_participants: Number(formData.eventDetails.max_participants),
                event_date: formData.eventDetails.event_date?.toISOString(),
                booking_deadline: formData.ticketConfig.booking_settings.booking_deadline?.toISOString(),
            };

            let result;
            if (isCurrentlyEdit && currentEventId) {
                result = await organizerService.updateEvent(currentEventId, eventData);
                setSuccess("Modifications sauvegardées avec succès !");
            } else {
                result = await organizerService.createEvent(eventData);
                // Update state to reflect that we now have an event and are in edit mode
                if (result?.id) {
                    setCurrentEventId(result.id);
                    setIsCurrentlyEdit(true);
                    // Update URL without page reload
                    window.history.replaceState({}, '', `/events/${result.id}/edit`);
                }
                setSuccess("Événement sauvegardé comme brouillon !");
            }

            // Handle image upload if present
            const targetEventId = currentEventId || result?.id;
            if (formData.eventDetails.image && targetEventId) {
                try {
                    await organizerService.uploadEventImage(targetEventId, formData.eventDetails.image);
                } catch (imageError) {
                    console.error("Image upload failed:", imageError);
                    // Don't show error for image upload failure on save, just log it
                }
            }

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccess("");
            }, 3000);

        } catch (error) {
            setError(error.message || "Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    // Handle wizard completion
    const handleComplete = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Combine all form data into event format
            const eventData = {
                ...formData.eventDetails,
                ...formData.venue,
                ...formData.publication,
                ticket_template_id: formData.ticketConfig.template_id,
                // Convert data types
                original_price: Number(formData.eventDetails.original_price) || 0,
                discounted_price: Number(formData.eventDetails.discounted_price) || 0,
                discount_percentage: Number(formData.eventDetails.discount_percentage) || 0,
                max_participants: Number(formData.eventDetails.max_participants),
                event_date: formData.eventDetails.event_date?.toISOString(),
                booking_deadline: formData.ticketConfig.booking_settings.booking_deadline?.toISOString(),
            };

            let result;
            if (isCurrentlyEdit && currentEventId) {
                result = await organizerService.updateEvent(currentEventId, eventData);
                setSuccess("Événement mis à jour avec succès !");
            } else {
                result = await organizerService.createEvent(eventData);
                setSuccess("Événement créé avec succès ! Vous pouvez maintenant le soumettre pour révision.");
            }

            // Handle image upload if present
            const targetEventId = currentEventId || result?.id;
            if (formData.eventDetails.image && targetEventId) {
                try {
                    await organizerService.uploadEventImage(targetEventId, formData.eventDetails.image);
                } catch (imageError) {
                    console.error("Image upload failed:", imageError);
                    setError(prev => prev + " (Erreur lors de l'upload de l'image)");
                }
            }

            setTimeout(() => {
                navigate("/events");
            }, 2000);

        } catch (error) {
            setError(error.message || "Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    // Get current step data
    const getCurrentStepData = () => {
        switch (activeStep) {
            case 0: return formData.eventDetails;
            case 1: return formData.venue;
            case 2: return formData.ticketConfig;
            case 3: return formData.publication;
            default: return {};
        }
    };

    // Get current step key
    const getCurrentStepKey = () => {
        switch (activeStep) {
            case 0: return 'eventDetails';
            case 1: return 'venue';
            case 2: return 'ticketConfig';
            case 3: return 'publication';
            default: return 'eventDetails';
        }
    };

    // Get preview component based on step
    const getPreviewComponent = () => {
        const stepConfig = [
            { previewType: "mobile" },  // Event Details
            { previewType: "mobile" },  // Venue
            { previewType: "ticket" },  // Ticket Design
            { previewType: "mobile" },  // Publication
        ];

        const currentConfig = stepConfig[activeStep];

        if (currentConfig.previewType === "mobile") {
            return (
                <EventMobilePreview
                    formData={formData.eventDetails}
                    venues={venues}
                    categories={categories}
                    imagePreview={imagePreview}
                />
            );
        } else {
            return (
                <TicketPreview
                    formData={formData}
                    venues={venues}
                    categories={categories}
                    templates={ticketTemplates}
                />
            );
        }
    };

    if (initialLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <EventFormStepper
            activeStep={activeStep}
            onStepChange={handleStepChange}
            formData={formData}
            onComplete={handleComplete}
            onSave={handleSaveChanges}
            loading={loading}
        >
            {/* Form Column */}
            <Grid size={{ xs: 12, lg: 8 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                {/* Render current step component */}
                {activeStep === 0 && (
                    <EventDetailsStep
                        data={getCurrentStepData()}
                        onChange={(data) => handleStepDataChange(getCurrentStepKey(), data)}
                        categories={categories}
                        onImageChange={setImagePreview}
                    />
                )}

                {activeStep === 1 && (
                    <VenueStep
                        data={getCurrentStepData()}
                        onChange={(data) => handleStepDataChange(getCurrentStepKey(), data)}
                        venues={venues}
                        onVenuesUpdate={setVenues}
                        onError={setError}
                        onSuccess={setSuccess}
                    />
                )}

                {activeStep === 2 && (
                    <TicketDesignStep
                        data={getCurrentStepData()}
                        onChange={(data) => handleStepDataChange(getCurrentStepKey(), data)}
                        templates={ticketTemplates}
                        eventData={formData}
                    />
                )}

                {activeStep === 3 && (
                    <PublicationStep
                        data={getCurrentStepData()}
                        onChange={(data) => handleStepDataChange(getCurrentStepKey(), data)}
                        adminData={formData.adminData}
                        isEdit={isEdit}
                        loading={loading}
                        onSubmitForReview={handleSubmitForReview}
                        onTogglePublication={handleTogglePublication}
                        onRevert={handleRevert}
                    />
                )}
            </Grid>

            {/* Preview Column */}
            <Grid size={{ xs: 12, lg: 4 }}>
                <Box sx={{ position: "sticky", top: 20 }}>
                    {getPreviewComponent()}
                </Box>
            </Grid>
        </EventFormStepper>
    );
};

export default EventFormWizard;
