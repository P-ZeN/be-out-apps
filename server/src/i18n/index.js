import i18next from 'i18next';

// Configure i18next for server-side usage
const i18n = i18next.createInstance();

// Translation resources for server-side messages
const serverTranslations = {
    fr: {
        translation: {
            // Generic errors
            "Missing required fields": "Champs obligatoires manquants",
            "Invalid request": "Requête invalide",
            "Database error": "Erreur de base de données",
            "Internal server error": "Erreur interne du serveur",
            "Access denied": "Accès refusé",
            "Unauthorized": "Non autorisé",
            "Resource not found": "Ressource non trouvée",
            "Validation failed": "Échec de la validation",
            "Operation failed": "Échec de l'opération",

            // Event-specific errors
            "Event not found": "Événement non trouvé",
            "Event creation failed": "Échec de la création de l'événement",
            "Event update failed": "Échec de la mise à jour de l'événement",
            "Event deletion failed": "Échec de la suppression de l'événement",
            "Invalid event data": "Données d'événement invalides",
            "Event already exists": "L'événement existe déjà",
            "Event status change failed": "Échec du changement de statut de l'événement",

            // Venue-specific errors
            "Venue not found": "Lieu non trouvé",
            "Venue creation failed": "Échec de la création du lieu",
            "Venue update failed": "Échec de la mise à jour du lieu",
            "Venue deletion failed": "Échec de la suppression du lieu",
            "Invalid venue data": "Données de lieu invalides",
            "Address creation failed": "Échec de la création de l'adresse",

            // Template-specific errors
            "Template not found": "Modèle non trouvé",
            "Template creation failed": "Échec de la création du modèle",
            "Template update failed": "Échec de la mise à jour du modèle",
            "Template deletion failed": "Échec de la suppression du modèle",
            "Invalid template data": "Données de modèle invalides",

            // Booking-specific errors
            "Booking not found": "Réservation non trouvée",
            "Booking creation failed": "Échec de la création de la réservation",
            "Booking update failed": "Échec de la mise à jour de la réservation",
            "Booking cancellation failed": "Échec de l'annulation de la réservation",
            "Invalid booking data": "Données de réservation invalides",
            "Insufficient availability": "Disponibilité insuffisante",

            // File-specific errors
            "File upload failed": "Échec du téléchargement de fichier",
            "File not found": "Fichier non trouvé",
            "File deletion failed": "Échec de la suppression du fichier",
            "Invalid file format": "Format de fichier invalide",
            "File too large": "Fichier trop volumineux",

            // Success messages
            "Event created successfully": "Événement créé avec succès",
            "Event updated successfully": "Événement mis à jour avec succès",
            "Event deleted successfully": "Événement supprimé avec succès",
            "Event status updated successfully": "Statut de l'événement mis à jour avec succès",
            "Venue created successfully": "Lieu créé avec succès",
            "Venue updated successfully": "Lieu mis à jour avec succès",
            "Venue deleted successfully": "Lieu supprimé avec succès",
            "Template created successfully": "Modèle créé avec succès",
            "Template updated successfully": "Modèle mis à jour avec succès",
            "Template deleted successfully": "Modèle supprimé avec succès",
            "Booking created successfully": "Réservation créée avec succès",
            "Booking updated successfully": "Réservation mise à jour avec succès",
            "Booking cancelled successfully": "Réservation annulée avec succès",
            "File uploaded successfully": "Fichier téléchargé avec succès",
            "File deleted successfully": "Fichier supprimé avec succès",

            // Validation messages
            "Title is required": "Le titre est obligatoire",
            "Description is required": "La description est obligatoire",
            "Date is required": "La date est obligatoire",
            "Location is required": "Le lieu est obligatoire",
            "Price must be a valid number": "Le prix doit être un nombre valide",
            "Capacity must be a positive integer": "La capacité doit être un entier positif",
            "Email is required": "L'email est obligatoire",
            "Invalid email format": "Format d'email invalide",
            "Phone number is required": "Le numéro de téléphone est obligatoire",
            "Name is required": "Le nom est obligatoire",
            "Address is required": "L'adresse est obligatoire",

            // Moderation messages
            "Event submitted for review": "Événement soumis pour révision",
            "Event approved": "Événement approuvé",
            "Event rejected": "Événement rejeté",
            "Moderation comment added": "Commentaire de modération ajouté",
            "Invalid moderation status": "Statut de modération invalide",
            "Moderation action failed": "Échec de l'action de modération",

            // Database/Server operation errors
            "Error fetching profile": "Erreur lors de la récupération du profil",
            "Error fetching organizer profile": "Erreur lors de la récupération du profil organisateur",
            "Error updating organizer profile": "Erreur lors de la mise à jour du profil organisateur",
            "Error fetching dashboard stats": "Erreur lors de la récupération des statistiques",
            "Error fetching upcoming events": "Erreur lors de la récupération des événements à venir",
            "Error fetching recent bookings": "Erreur lors de la récupération des réservations récentes",
            "Error fetching events": "Erreur lors de la récupération des événements",
            "Error fetching event": "Erreur lors de la récupération de l'événement",
            "Error fetching bookings": "Erreur lors de la récupération des réservations",
            "Error fetching venues": "Erreur lors de la récupération des lieux",
            "Error fetching venue": "Erreur lors de la récupération du lieu",
            "Organizer profile not found": "Profil organisateur non trouvé",
        }
    },
    en: {
        translation: {
            // Generic errors
            "Missing required fields": "Missing required fields",
            "Invalid request": "Invalid request",
            "Database error": "Database error",
            "Internal server error": "Internal server error",
            "Access denied": "Access denied",
            "Unauthorized": "Unauthorized",
            "Resource not found": "Resource not found",
            "Validation failed": "Validation failed",
            "Operation failed": "Operation failed",

            // Event-specific errors
            "Event not found": "Event not found",
            "Event creation failed": "Event creation failed",
            "Event update failed": "Event update failed",
            "Event deletion failed": "Event deletion failed",
            "Invalid event data": "Invalid event data",
            "Event already exists": "Event already exists",
            "Event status change failed": "Event status change failed",

            // Venue-specific errors
            "Venue not found": "Venue not found",
            "Venue creation failed": "Venue creation failed",
            "Venue update failed": "Venue update failed",
            "Venue deletion failed": "Venue deletion failed",
            "Invalid venue data": "Invalid venue data",
            "Address creation failed": "Address creation failed",

            // Template-specific errors
            "Template not found": "Template not found",
            "Template creation failed": "Template creation failed",
            "Template update failed": "Template update failed",
            "Template deletion failed": "Template deletion failed",
            "Invalid template data": "Invalid template data",

            // Booking-specific errors
            "Booking not found": "Booking not found",
            "Booking creation failed": "Booking creation failed",
            "Booking update failed": "Booking update failed",
            "Booking cancellation failed": "Booking cancellation failed",
            "Invalid booking data": "Invalid booking data",
            "Insufficient availability": "Insufficient availability",

            // File-specific errors
            "File upload failed": "File upload failed",
            "File not found": "File not found",
            "File deletion failed": "File deletion failed",
            "Invalid file format": "Invalid file format",
            "File too large": "File too large",

            // Success messages
            "Event created successfully": "Event created successfully",
            "Event updated successfully": "Event updated successfully",
            "Event deleted successfully": "Event deleted successfully",
            "Event status updated successfully": "Event status updated successfully",
            "Venue created successfully": "Venue created successfully",
            "Venue updated successfully": "Venue updated successfully",
            "Venue deleted successfully": "Venue deleted successfully",
            "Template created successfully": "Template created successfully",
            "Template updated successfully": "Template updated successfully",
            "Template deleted successfully": "Template deleted successfully",
            "Booking created successfully": "Booking created successfully",
            "Booking updated successfully": "Booking updated successfully",
            "Booking cancelled successfully": "Booking cancelled successfully",
            "File uploaded successfully": "File uploaded successfully",
            "File deleted successfully": "File deleted successfully",

            // Validation messages
            "Title is required": "Title is required",
            "Description is required": "Description is required",
            "Date is required": "Date is required",
            "Location is required": "Location is required",
            "Price must be a valid number": "Price must be a valid number",
            "Capacity must be a positive integer": "Capacity must be a positive integer",
            "Email is required": "Email is required",
            "Invalid email format": "Invalid email format",
            "Phone number is required": "Phone number is required",
            "Name is required": "Name is required",
            "Address is required": "Address is required",

            // Moderation messages
            "Event submitted for review": "Event submitted for review",
            "Event approved": "Event approved",
            "Event rejected": "Event rejected",
            "Moderation comment added": "Moderation comment added",
            "Invalid moderation status": "Invalid moderation status",
            "Moderation action failed": "Moderation action failed",

            // Database/Server operation errors
            "Error fetching profile": "Error fetching profile",
            "Error fetching organizer profile": "Error fetching organizer profile",
            "Error updating organizer profile": "Error updating organizer profile",
            "Error fetching dashboard stats": "Error fetching dashboard stats",
            "Error fetching upcoming events": "Error fetching upcoming events",
            "Error fetching recent bookings": "Error fetching recent bookings",
            "Error fetching events": "Error fetching events",
            "Error fetching event": "Error fetching event",
            "Error fetching bookings": "Error fetching bookings",
            "Error fetching venues": "Error fetching venues",
            "Error fetching venue": "Error fetching venue",
            "Organizer profile not found": "Organizer profile not found",
        }
    },
    es: {
        translation: {
            // Generic errors
            "Missing required fields": "Faltan campos obligatorios",
            "Invalid request": "Solicitud inválida",
            "Database error": "Error de base de datos",
            "Internal server error": "Error interno del servidor",
            "Access denied": "Acceso denegado",
            "Unauthorized": "No autorizado",
            "Resource not found": "Recurso no encontrado",
            "Validation failed": "Fallo en la validación",
            "Operation failed": "Operación fallida",

            // Event-specific errors
            "Event not found": "Evento no encontrado",
            "Event creation failed": "Fallo en la creación del evento",
            "Event update failed": "Fallo en la actualización del evento",
            "Event deletion failed": "Fallo en la eliminación del evento",
            "Invalid event data": "Datos de evento inválidos",
            "Event already exists": "El evento ya existe",
            "Event status change failed": "Fallo en el cambio de estado del evento",

            // Venue-specific errors
            "Venue not found": "Lugar no encontrado",
            "Venue creation failed": "Fallo en la creación del lugar",
            "Venue update failed": "Fallo en la actualización del lugar",
            "Venue deletion failed": "Fallo en la eliminación del lugar",
            "Invalid venue data": "Datos de lugar inválidos",
            "Address creation failed": "Fallo en la creación de la dirección",

            // Template-specific errors
            "Template not found": "Plantilla no encontrada",
            "Template creation failed": "Fallo en la creación de la plantilla",
            "Template update failed": "Fallo en la actualización de la plantilla",
            "Template deletion failed": "Fallo en la eliminación de la plantilla",
            "Invalid template data": "Datos de plantilla inválidos",

            // Booking-specific errors
            "Booking not found": "Reserva no encontrada",
            "Booking creation failed": "Fallo en la creación de la reserva",
            "Booking update failed": "Fallo en la actualización de la reserva",
            "Booking cancellation failed": "Fallo en la cancelación de la reserva",
            "Invalid booking data": "Datos de reserva inválidos",
            "Insufficient availability": "Disponibilidad insuficiente",

            // File-specific errors
            "File upload failed": "Fallo en la subida del archivo",
            "File not found": "Archivo no encontrado",
            "File deletion failed": "Fallo en la eliminación del archivo",
            "Invalid file format": "Formato de archivo inválido",
            "File too large": "Archivo demasiado grande",

            // Success messages
            "Event created successfully": "Evento creado exitosamente",
            "Event updated successfully": "Evento actualizado exitosamente",
            "Event deleted successfully": "Evento eliminado exitosamente",
            "Event status updated successfully": "Estado del evento actualizado exitosamente",
            "Venue created successfully": "Lugar creado exitosamente",
            "Venue updated successfully": "Lugar actualizado exitosamente",
            "Venue deleted successfully": "Lugar eliminado exitosamente",
            "Template created successfully": "Plantilla creada exitosamente",
            "Template updated successfully": "Plantilla actualizada exitosamente",
            "Template deleted successfully": "Plantilla eliminada exitosamente",
            "Booking created successfully": "Reserva creada exitosamente",
            "Booking updated successfully": "Reserva actualizada exitosamente",
            "Booking cancelled successfully": "Reserva cancelada exitosamente",
            "File uploaded successfully": "Archivo subido exitosamente",
            "File deleted successfully": "Archivo eliminado exitosamente",

            // Validation messages
            "Title is required": "El título es obligatorio",
            "Description is required": "La descripción es obligatoria",
            "Date is required": "La fecha es obligatoria",
            "Location is required": "El lugar es obligatorio",
            "Price must be a valid number": "El precio debe ser un número válido",
            "Capacity must be a positive integer": "La capacidad debe ser un entero positivo",
            "Email is required": "El email es obligatorio",
            "Invalid email format": "Formato de email inválido",
            "Phone number is required": "El número de teléfono es obligatorio",
            "Name is required": "El nombre es obligatorio",
            "Address is required": "La dirección es obligatoria",

            // Moderation messages
            "Event submitted for review": "Evento enviado para revisión",
            "Event approved": "Evento aprobado",
            "Event rejected": "Evento rechazado",
            "Moderation comment added": "Comentario de moderación agregado",
            "Invalid moderation status": "Estado de moderación inválido",
            "Moderation action failed": "Fallo en la acción de moderación",

            // Database/Server operation errors
            "Error fetching profile": "Error al obtener el perfil",
            "Error fetching organizer profile": "Error al obtener el perfil del organizador",
            "Error updating organizer profile": "Error al actualizar el perfil del organizador",
            "Error fetching dashboard stats": "Error al obtener las estadísticas",
            "Error fetching upcoming events": "Error al obtener los eventos próximos",
            "Error fetching recent bookings": "Error al obtener las reservas recientes",
            "Error fetching events": "Error al obtener los eventos",
            "Error fetching event": "Error al obtener el evento",
            "Error fetching bookings": "Error al obtener las reservas",
            "Error fetching venues": "Error al obtener los lugares",
            "Error fetching venue": "Error al obtener el lugar",
            "Organizer profile not found": "Perfil de organizador no encontrado",
        }
    }
};

// Initialize i18next for server-side usage
i18n.init({
    resources: serverTranslations,
    lng: 'fr', // Default language
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    },
    debug: false
});

// Middleware function to extract language from request headers or query params
export const getLanguageFromRequest = (req) => {
    // Priority: query param > Accept-Language header > default
    return req.query.lang ||
           req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
           'fr';
};

// Helper function to get translated message
export const t = (key, options = {}) => {
    return i18n.t(key, options);
};

// Helper function to get translated message with specific language
export const tWithLang = (lang, key, options = {}) => {
    return i18n.t(key, { ...options, lng: lang });
};

// Middleware to add translation function to request object
export const i18nMiddleware = (req, res, next) => {
    const language = getLanguageFromRequest(req);
    req.t = (key, options = {}) => tWithLang(language, key, options);
    req.language = language;
    next();
};

export default i18n;
