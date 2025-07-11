import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, Tooltip } from "@mui/material";

/**
 * TemplateGallery - Affiche une galerie de templates existants pour sélection rapide
 * @param {Object[]} templates - Liste des templates disponibles
 * @param {Function} onTemplateLoad - Callback appelé lors de la sélection d'un template
 */
const TemplateGallery = ({ templates = [], onTemplateLoad }) => {
    // Filter templates to show only active ones for the gallery
    // If status is undefined, assume it's active (for backward compatibility)
    const galleryTemplates = templates.filter((template) => !template.status || template.status === "active");

    if (galleryTemplates.length === 0) {
        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Galerie de Templates :
                </Typography>
                <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
                    Aucun template actif disponible pour la galerie
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                Galerie de Templates ({galleryTemplates.length}) :
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {galleryTemplates.map((template) => (
                    <Tooltip
                        key={template.id}
                        title={`${template.subject || "Pas de sujet"} - ${template.language?.toUpperCase() || "FR"}`}
                        arrow
                        placement="top">
                        <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            onClick={() => onTemplateLoad(template.body)}
                            sx={{
                                fontSize: "0.7rem",
                                py: 0.5,
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                            {template.name}
                        </Button>
                    </Tooltip>
                ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Cliquez sur un template pour charger son contenu dans l'éditeur
            </Typography>
        </Box>
    );
};

TemplateGallery.propTypes = {
    templates: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            body: PropTypes.string.isRequired,
            subject: PropTypes.string,
            language: PropTypes.string,
            status: PropTypes.string, // Not required - may be undefined
        })
    ),
    onTemplateLoad: PropTypes.func.isRequired,
};

export default TemplateGallery;
