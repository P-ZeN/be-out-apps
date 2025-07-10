import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { quickVariables } from "../constants";

const QuickVariables = ({ onVariableInsert }) => {
    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                Variables Rapides :
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {quickVariables.map((variable) => (
                    <Button
                        key={variable.label}
                        size="small"
                        variant="outlined"
                        onClick={() => onVariableInsert(variable)}
                        sx={{ fontSize: "0.7rem", py: 0.5 }}>
                        {variable.label}
                    </Button>
                ))}
            </Box>
        </Box>
    );
};

export default QuickVariables;
