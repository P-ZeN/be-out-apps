import React from "react";
import { Box } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";

/**
 * IconRenderer - Renders either a Material-UI icon or an emoji
 * @param {string} iconName - Material-UI icon name (camelCase) or emoji
 * @param {object} props - Additional props to pass to the icon
 */
const IconRenderer = ({ iconName, sx, ...props }) => {
    if (!iconName) return null;

    // Check if it's an emoji (contains unicode characters or is a simple emoji pattern)
    const isEmoji =
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
            iconName
        ) ||
        (iconName.length <= 2 && /^[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u.test(iconName));

    if (isEmoji) {
        return (
            <Box
                component="span"
                sx={{
                    fontSize: sx?.fontSize || "1.2em",
                    display: "inline-flex",
                    alignItems: "center",
                    ...sx,
                }}
                {...props}>
                {iconName}
            </Box>
        );
    }

    // Try to render as Material-UI icon
    try {
        let IconComponent;

        // First, try the icon name as-is (for PascalCase names like "MusicNote")
        IconComponent = MuiIcons[iconName];

        if (!IconComponent) {
            // If not found, try converting snake_case or kebab-case to PascalCase
            const iconNameFormatted = iconName
                .split(/[-_]/)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join("");

            IconComponent = MuiIcons[iconNameFormatted];
        }

        if (!IconComponent) {
            // Try lowercase first letter (camelCase like "musicNote")
            const camelCaseName = iconName.charAt(0).toLowerCase() + iconName.slice(1);
            IconComponent = MuiIcons[camelCaseName];
        }

        if (IconComponent) {
            return <IconComponent sx={sx} {...props} />;
        }
    } catch (error) {
        console.warn(`Icon "${iconName}" not found in Material-UI icons`);
    }

    // Fallback to text display if icon not found
    return (
        <Box
            component="span"
            sx={{
                fontSize: "0.875rem",
                color: "text.secondary",
                fontStyle: "italic",
                ...sx,
            }}
            {...props}>
            {iconName}
        </Box>
    );
};

export default IconRenderer;
