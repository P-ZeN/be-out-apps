import React, { useState } from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Tooltip,
    Typography,
    Chip,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
} from "@mui/material";
import { Edit, Save, Cancel, ExpandMore, Key as KeyIcon, Translate, DataObject } from "@mui/icons-material";
import JsonEditorModal from "./JsonEditorModal";

const TranslationEditor = ({ translations, onUpdateKey, onSave, language, namespace }) => {
    const [editingKeys, setEditingKeys] = useState(new Set());
    const [editValues, setEditValues] = useState({});
    const [jsonModalOpen, setJsonModalOpen] = useState(false);
    const [jsonModalData, setJsonModalData] = useState({ key: "", value: null });

    // Helper function to check if a value is a JSON object (not string, not array)
    const isJsonObject = (value) => {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    };

    // Helper function to check if a string value looks like JSON
    const looksLikeJson = (value) => {
        if (typeof value !== "string") return false;
        const trimmed = value.trim();
        return (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));
    };

    // Open JSON editor modal
    const openJsonEditor = (key, value) => {
        setJsonModalData({ key, value });
        setJsonModalOpen(true);
    };

    // Handle save from JSON editor modal
    const handleJsonSave = (updatedValue) => {
        onUpdateKey(jsonModalData.key, updatedValue);
        setJsonModalOpen(false);
        setJsonModalData({ key: "", value: null });
    };

    // Close JSON editor modal
    const closeJsonEditor = () => {
        setJsonModalOpen(false);
        setJsonModalData({ key: "", value: null });
    };

    const startEdit = (key) => {
        setEditingKeys((prev) => new Set([...prev, key]));
        const value = translations[key];
        const stringValue = typeof value === "string" ? value : JSON.stringify(value, null, 2);
        setEditValues((prev) => ({ ...prev, [key]: stringValue }));
    };

    const cancelEdit = (key) => {
        setEditingKeys((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
        setEditValues((prev) => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    };

    const saveEdit = async (key) => {
        let valueToSave = editValues[key];

        // Try to parse as JSON if it looks like JSON, otherwise keep as string
        if (valueToSave.trim().startsWith("{") || valueToSave.trim().startsWith("[")) {
            try {
                valueToSave = JSON.parse(valueToSave);
            } catch (e) {
                // If parsing fails, keep as string
            }
        }

        // Create updated translations object for saving
        const updatedTranslations = {
            ...translations,
            [key]: valueToSave,
        };

        // Update local state first
        onUpdateKey(key, valueToSave);

        // Clear editing state
        setEditingKeys((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
        setEditValues((prev) => {
            const newPrev = { ...prev };
            delete newPrev[key];
            return newPrev;
        });

        // Trigger auto-save with the updated translations
        if (onSave) {
            try {
                await onSave(updatedTranslations);
            } catch (error) {
                console.error("Error auto-saving translation:", error);
                // If save fails, we don't revert the local state
                // The user can try saving again with the main save button
            }
        }
    };

    const handleValueChange = (key, value) => {
        setEditValues((prev) => ({ ...prev, [key]: value }));
    };

    // Group translations by prefix (e.g., "buttons", "messages", etc.)
    const groupedTranslations = Object.entries(translations).reduce((groups, [key, value]) => {
        const prefix = key.includes(".") ? key.split(".")[0] : "root";
        if (!groups[prefix]) {
            groups[prefix] = [];
        }
        groups[prefix].push([key, value]);
        return groups;
    }, {});

    const getKeyDepth = (key) => {
        return key.split(".").length - 1;
    };

    const formatKey = (key) => {
        const parts = key.split(".");
        return parts[parts.length - 1];
    };

    const getKeyHierarchy = (key) => {
        const parts = key.split(".");
        if (parts.length <= 1) return null;
        return parts.slice(0, -1).join(".");
    };

    if (Object.keys(translations).length === 0) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="info">
                    Aucune traduction trouvée pour {language}/{namespace}. Les clés de traduction sont gérées par les
                    développeurs dans le code source.
                </Alert>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                        icon={<Translate />}
                        label={`${language.toUpperCase()} - ${namespace}`}
                        color="primary"
                        variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                        {Object.keys(translations).length} clés de traduction
                    </Typography>
                </Stack>
            </Box>

            {Object.entries(groupedTranslations).map(([group, entries]) => (
                <Accordion key={group} defaultExpanded={true} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <KeyIcon fontSize="small" />
                            <Typography variant="h6">{group === "root" ? "Niveau Racine" : group}</Typography>
                            <Chip size="small" label={entries.length} />
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="40%">Clé</TableCell>
                                        <TableCell width="50%">Traduction</TableCell>
                                        <TableCell width="10%" align="center">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map(([key, value]) => {
                                        const isEditing = editingKeys.has(key);
                                        const depth = getKeyDepth(key);
                                        const hierarchy = getKeyHierarchy(key);
                                        const displayKey = formatKey(key);

                                        return (
                                            <TableRow key={key} hover>
                                                <TableCell>
                                                    <Box sx={{ pl: depth * 2 }}>
                                                        {hierarchy && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                display="block">
                                                                {hierarchy}.
                                                            </Typography>
                                                        )}
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={depth === 0 ? "bold" : "normal"}>
                                                            {displayKey}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            display="block">
                                                            {key}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={
                                                                (typeof value === "string"
                                                                    ? value.length
                                                                    : JSON.stringify(value).length) > 50
                                                                    ? 3
                                                                    : 1
                                                            }
                                                            value={String(editValues[key] || "")}
                                                            onChange={(e) => handleValueChange(key, e.target.value)}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Box>
                                                            {isJsonObject(value) ? (
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Chip
                                                                        icon={<DataObject />}
                                                                        label={`JSON (${
                                                                            Object.keys(value).length
                                                                        } keys)`}
                                                                        size="small"
                                                                        color="secondary"
                                                                        variant="outlined"
                                                                    />
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary">
                                                                        {JSON.stringify(value).substring(0, 60)}...
                                                                    </Typography>
                                                                </Stack>
                                                            ) : (
                                                                <Typography variant="body2">
                                                                    {typeof value === "string"
                                                                        ? value
                                                                        : JSON.stringify(value)}
                                                                </Typography>
                                                            )}
                                                            {(typeof value === "string"
                                                                ? value.length
                                                                : JSON.stringify(value).length) > 100 && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {typeof value === "string"
                                                                        ? value.length
                                                                        : JSON.stringify(value).length}{" "}
                                                                    characters
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        {isEditing ? (
                                                            <>
                                                                <Tooltip title="Sauvegarder">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => saveEdit(key)}>
                                                                        <Save fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Annuler">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => cancelEdit(key)}>
                                                                        <Cancel fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isJsonObject(value) || looksLikeJson(value) ? (
                                                                    <Tooltip title="Modifier la Structure JSON">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="secondary"
                                                                            onClick={() => openJsonEditor(key, value)}>
                                                                            <DataObject fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip title="Modifier">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => startEdit(key)}>
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
            ))}

            <JsonEditorModal
                open={jsonModalOpen}
                onClose={closeJsonEditor}
                onSave={handleJsonSave}
                initialValue={jsonModalData.value}
                keyName={jsonModalData.key}
            />
        </Box>
    );
};

export default TranslationEditor;
