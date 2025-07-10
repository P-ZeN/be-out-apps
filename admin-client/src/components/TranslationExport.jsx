import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Alert,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
} from "@mui/material";
import { FileDownload, GetApp, Language, Description, CheckCircle } from "@mui/icons-material";
import translationService from "../services/translationService";

const TranslationExport = ({ selectedLanguage, selectedNamespace }) => {
    const [exportFormat, setExportFormat] = useState("json");
    const [exportScope, setExportScope] = useState("current");
    const [exporting, setExporting] = useState(false);
    const [exportResult, setExportResult] = useState(null);

    const exportFormats = [
        { value: "json", label: "JSON", description: "Standard JSON format" },
        { value: "flat-json", label: "Flat JSON", description: "Flattened key-value pairs" },
        { value: "csv", label: "CSV", description: "Comma-separated values" },
        { value: "xlsx", label: "Excel", description: "Excel spreadsheet" },
    ];

    const exportScopes = [
        {
            value: "current",
            label: "Current Selection",
            description: `${selectedLanguage}/${selectedNamespace}`,
        },
        {
            value: "language",
            label: "All Namespaces",
            description: `All namespaces for ${selectedLanguage}`,
        },
        {
            value: "namespace",
            label: "All Languages",
            description: `${selectedNamespace} in all languages`,
        },
        {
            value: "all",
            label: "Everything",
            description: "All translations",
        },
    ];

    const handleExport = async () => {
        try {
            setExporting(true);
            setExportResult(null);

            let filename;
            let blob;

            switch (exportScope) {
                case "current":
                    blob = await translationService.exportTranslations(selectedLanguage, selectedNamespace);
                    filename = `${selectedLanguage}-${selectedNamespace}.${exportFormat}`;
                    break;
                case "language":
                    // Export all namespaces for the selected language
                    const namespaces = await translationService.getAvailableNamespaces(selectedLanguage);
                    const languageData = {};

                    for (const ns of namespaces) {
                        try {
                            const nsData = await translationService.getTranslations(selectedLanguage, ns);
                            languageData[ns] = nsData;
                        } catch (err) {
                            console.warn(`Failed to load namespace ${ns}:`, err);
                        }
                    }

                    blob = new Blob([JSON.stringify(languageData, null, 2)], { type: "application/json" });
                    filename = `${selectedLanguage}-all-namespaces.${exportFormat}`;
                    break;
                case "namespace":
                    // Export the selected namespace for all languages
                    const languages = await translationService.getAvailableLanguages();
                    const namespaceData = {};

                    for (const lang of languages) {
                        try {
                            const langData = await translationService.getTranslations(lang, selectedNamespace);
                            namespaceData[lang] = langData;
                        } catch (err) {
                            console.warn(`Failed to load language ${lang}:`, err);
                        }
                    }

                    blob = new Blob([JSON.stringify(namespaceData, null, 2)], { type: "application/json" });
                    filename = `all-languages-${selectedNamespace}.${exportFormat}`;
                    break;
                case "all":
                    // Export everything
                    const allLanguages = await translationService.getAvailableLanguages();
                    const allData = {};

                    for (const lang of allLanguages) {
                        const allNamespaces = await translationService.getAvailableNamespaces(lang);
                        allData[lang] = {};

                        for (const ns of allNamespaces) {
                            try {
                                const data = await translationService.getTranslations(lang, ns);
                                allData[lang][ns] = data;
                            } catch (err) {
                                console.warn(`Failed to load ${lang}/${ns}:`, err);
                            }
                        }
                    }

                    blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                    filename = `all-translations.${exportFormat}`;
                    break;
                default:
                    throw new Error("Invalid export scope");
            }

            // Download the file
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportResult({
                success: true,
                filename,
                size: blob.size,
            });
        } catch (err) {
            console.error("Export failed:", err);
            setExportResult({
                success: false,
                error: err.message || "Export failed",
            });
        } finally {
            setExporting(false);
        }
    };

    const getEstimatedSize = () => {
        switch (exportScope) {
            case "current":
                return "< 1 MB";
            case "language":
                return "< 5 MB";
            case "namespace":
                return "< 3 MB";
            case "all":
                return "< 10 MB";
            default:
                return "Unknown";
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Export Translations
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Export translations in various formats for backup or external use
                </Typography>

                <Stack spacing={3}>
                    {/* Export Scope */}
                    <FormControl fullWidth>
                        <InputLabel>Export Scope</InputLabel>
                        <Select
                            value={exportScope}
                            label="Export Scope"
                            onChange={(e) => setExportScope(e.target.value)}>
                            {exportScopes.map((scope) => (
                                <MenuItem key={scope.value} value={scope.value}>
                                    <Box>
                                        <Typography variant="body2">{scope.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {scope.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Export Format */}
                    <FormControl fullWidth>
                        <InputLabel>Format</InputLabel>
                        <Select value={exportFormat} label="Format" onChange={(e) => setExportFormat(e.target.value)}>
                            {exportFormats.map((format) => (
                                <MenuItem key={format.value} value={format.value}>
                                    <Box>
                                        <Typography variant="body2">{format.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {format.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Export Summary */}
                    <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Export Summary
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemIcon>
                                    <Language fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Scope"
                                    secondary={exportScopes.find((s) => s.value === exportScope)?.description}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <Description fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Format"
                                    secondary={exportFormats.find((f) => f.value === exportFormat)?.label}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <GetApp fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Estimated Size" secondary={getEstimatedSize()} />
                            </ListItem>
                        </List>
                    </Box>

                    {/* Export Result */}
                    {exportResult && (
                        <Alert
                            severity={exportResult.success ? "success" : "error"}
                            icon={exportResult.success ? <CheckCircle /> : undefined}>
                            {exportResult.success ? (
                                <Box>
                                    <Typography variant="body2">Export completed successfully!</Typography>
                                    <Typography variant="caption" display="block">
                                        File: {exportResult.filename} ({(exportResult.size / 1024).toFixed(1)} KB)
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography variant="body2">{exportResult.error}</Typography>
                            )}
                        </Alert>
                    )}
                </Stack>
            </CardContent>

            <CardActions>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    startIcon={exporting ? <CircularProgress size={16} /> : <FileDownload />}
                    onClick={handleExport}
                    disabled={exporting}>
                    {exporting ? "Exporting..." : "Export"}
                </Button>
            </CardActions>
        </Card>
    );
};

export default TranslationExport;
