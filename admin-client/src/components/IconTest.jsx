import React from "react";
import { Box } from "@mui/material";
import IconRenderer from "../components/IconRenderer";

const IconTest = () => {
    const testIcons = [
        "MusicNote",
        "SportsBaseball",
        "TheaterComedy",
        "Event",
        "Restaurant",
        "🎵",
        "⚽",
        "music_note",
        "sports-baseball",
    ];

    return (
        <Box sx={{ p: 2 }}>
            <h2>Icon Renderer Test</h2>
            {testIcons.map((iconName, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                    <Box sx={{ minWidth: 150 }}>{iconName}:</Box>
                    <IconRenderer iconName={iconName} />
                </Box>
            ))}
        </Box>
    );
};

export default IconTest;
