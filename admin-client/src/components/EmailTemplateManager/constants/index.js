export const availableLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
];

export const getStatusColor = (status) => {
    switch (status) {
        case "sent":
            return "success";
        case "failed":
            return "error";
        case "bounced":
            return "warning";
        default:
            return "default";
    }
};

export const quickVariables = [
    { label: "Nom Utilisateur", value: "{{ userName }}" },
    { label: "Email", value: "{{ email }}" },
    { label: "Nom Événement", value: "{{ eventName }}" },
    { label: "Date Événement", value: "{{ eventDate }}" },
    { label: "Lieu Événement", value: "{{ eventLocation }}" },
    { label: "Lien Reset", value: "{{ resetLink }}" },
];
