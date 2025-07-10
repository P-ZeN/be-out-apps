import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Stack,
    Divider,
    Paper,
    Chip,
    Alert,
} from "@mui/material";
import { Add, Close, Save, DataObject } from "@mui/icons-material";

const JsonEditorModal = ({ open, onClose, onSave, initialValue, keyName }) => {
    const [fields, setFields] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && initialValue) {
            try {
                const parsed = typeof initialValue === "string" ? JSON.parse(initialValue) : initialValue;

                const flattenedFields = flattenObject(parsed);
                setFields(flattenedFields);
                setError("");
            } catch (e) {
                setError("Invalid JSON structure");
                setFields([]);
            }
        }
    }, [open, initialValue]);

    // Flatten nested object into array of key-value pairs
    const flattenObject = (obj, prefix = "") => {
        const result = [];

        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                result.push(...flattenObject(value, fullKey));
            } else {
                result.push({
                    id: Math.random().toString(36).substr(2, 9),
                    key: fullKey,
                    value: Array.isArray(value) ? JSON.stringify(value) : String(value || ""),
                    isArray: Array.isArray(value),
                });
            }
        }

        return result;
    };

    // Rebuild nested object from flattened fields
    const buildObject = (fields) => {
        const result = {};

        fields.forEach((field) => {
            if (!field.key.trim()) return;

            const keys = field.key.split(".");
            let current = result;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) {
                    current[key] = {};
                }
                current = current[key];
            }

            const finalKey = keys[keys.length - 1];
            let value = field.value;

            // Try to parse arrays back to JSON
            if (field.isArray) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // If parsing fails, keep as string
                }
            }

            current[finalKey] = value;
        });

        return result;
    };

    const handleFieldChange = (id, field, value) => {
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
    };

    const handleSave = () => {
        try {
            const rebuilt = buildObject(fields);
            onSave(rebuilt);
            onClose();
        } catch (e) {
            setError("Error building JSON structure");
        }
    };

    const handleClose = () => {
        setFields([]);
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { height: "80vh" },
            }}>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DataObject />
                    <Typography variant="h6">Edit JSON Object: {keyName}</Typography>
                    <IconButton edge="end" onClick={handleClose} sx={{ ml: "auto" }}>
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip icon={<DataObject />} label={`${fields.length} fields`} size="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                            Edit values only - keys are read-only
                        </Typography>
                    </Stack>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {fields.map((field, index) => (
                        <Paper key={field.id} sx={{ p: 2 }} variant="outlined">
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <TextField
                                    label="Key"
                                    value={field.key}
                                    onChange={(e) => handleFieldChange(field.id, "key", e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                    placeholder="e.g., buttons.submit"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    helperText="Keys are read-only"
                                />
                                <TextField
                                    label="Value"
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(field.id, "value", e.target.value)}
                                    size="small"
                                    sx={{ flex: 2 }}
                                    multiline
                                    rows={field.isArray ? 2 : 1}
                                    placeholder={field.isArray ? "JSON array format" : "Translation value"}
                                />
                            </Stack>
                            {field.isArray && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                    Array field - use JSON format: ["item1", "item2"]
                                </Typography>
                            )}
                        </Paper>
                    ))}

                    {fields.length === 0 && (
                        <Alert severity="info">No fields to edit. Click "Add Field" to create translation keys.</Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" startIcon={<Save />} disabled={fields.length === 0}>
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JsonEditorModal;
