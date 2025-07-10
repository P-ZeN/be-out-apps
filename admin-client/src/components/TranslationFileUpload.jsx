import React, { useState, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Card,
    CardContent,
    CardActions,
    Stack,
} from "@mui/material";
import { CloudUpload, CheckCircle, Error, FileUpload, Description } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import translationService from "../services/translationService";

const TranslationFileUpload = ({ onUploadComplete, selectedLanguage, selectedNamespace }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
            setError("Please upload a JSON file");
            return;
        }

        try {
            const fileContent = await file.text();
            const parsedData = translationService.parseTranslationFile(fileContent);

            // Flatten the data for preview
            const flattened = translationService.flattenTranslations(parsedData);
            setPreviewData({
                filename: file.name,
                size: file.size,
                keyCount: Object.keys(flattened).length,
                translations: flattened,
                rawData: parsedData,
            });
            setError(null);
        } catch (err) {
            setError("Invalid JSON file format");
            setPreviewData(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        accept: {
            "application/json": [".json"],
        },
        maxFiles: 1,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!previewData) return;

        try {
            setUploading(true);
            setError(null);

            // Create a new file from the parsed data
            const blob = new Blob([JSON.stringify(previewData.rawData, null, 2)], {
                type: "application/json",
            });
            const file = new File([blob], previewData.filename, { type: "application/json" });

            const result = await translationService.uploadTranslations(selectedLanguage, selectedNamespace, file);

            setUploadResults({
                success: true,
                message: "Translations uploaded successfully",
                keysAdded: result.keysAdded || 0,
                keysUpdated: result.keysUpdated || 0,
                keysTotal: result.keysTotal || Object.keys(previewData.translations).length,
            });

            // Clear preview after successful upload
            setPreviewData(null);

            // Notify parent component
            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (err) {
            setError(err.message || "Failed to upload translations");
            setUploadResults({
                success: false,
                message: err.message || "Upload failed",
            });
        } finally {
            setUploading(false);
        }
    };

    const clearAll = () => {
        setPreviewData(null);
        setUploadResults(null);
        setError(null);
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Upload Translation File
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Upload a JSON file to import translations for {selectedLanguage}/{selectedNamespace}
                </Typography>

                {/* File Drop Zone */}
                <Paper
                    {...getRootProps()}
                    sx={{
                        p: 3,
                        border: 2,
                        borderStyle: "dashed",
                        borderColor: isDragActive ? "primary.main" : "grey.300",
                        backgroundColor: isDragActive ? "action.hover" : "background.default",
                        cursor: "pointer",
                        textAlign: "center",
                        mb: 2,
                        transition: "all 0.2s ease",
                    }}>
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                        {isDragActive ? "Drop the file here" : "Drag & drop a JSON file here"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        or click to select a file
                    </Typography>
                </Paper>

                {/* Upload Progress */}
                {uploading && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Uploading translations...
                        </Typography>
                        <LinearProgress />
                    </Box>
                )}

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Upload Results */}
                {uploadResults && (
                    <Alert
                        severity={uploadResults.success ? "success" : "error"}
                        sx={{ mb: 2 }}
                        icon={uploadResults.success ? <CheckCircle /> : <Error />}>
                        <Typography variant="body2">{uploadResults.message}</Typography>
                        {uploadResults.success && (
                            <Typography variant="caption" display="block">
                                Keys added: {uploadResults.keysAdded} | Keys updated: {uploadResults.keysUpdated} |
                                Total: {uploadResults.keysTotal}
                            </Typography>
                        )}
                    </Alert>
                )}

                {/* File Preview */}
                {previewData && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            File Preview
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={1}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Description color="primary" />
                                    <Typography variant="body2">
                                        <strong>{previewData.filename}</strong>
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    Size: {(previewData.size / 1024).toFixed(1)} KB | Keys: {previewData.keyCount}
                                </Typography>
                            </Stack>

                            {/* Sample keys preview */}
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Sample Keys (first 5):
                            </Typography>
                            <List dense>
                                {Object.entries(previewData.translations)
                                    .slice(0, 5)
                                    .map(([key, value]) => (
                                        <ListItem key={key} sx={{ py: 0.5 }}>
                                            <ListItemText
                                                primary={key}
                                                secondary={
                                                    typeof value === "string"
                                                        ? value.length > 50
                                                            ? value.substring(0, 50) + "..."
                                                            : value
                                                        : JSON.stringify(value)
                                                }
                                                primaryTypographyProps={{ variant: "body2" }}
                                                secondaryTypographyProps={{ variant: "caption" }}
                                            />
                                        </ListItem>
                                    ))}
                                {previewData.keyCount > 5 && (
                                    <ListItem>
                                        <ListItemText
                                            primary={`... and ${previewData.keyCount - 5} more keys`}
                                            primaryTypographyProps={{
                                                variant: "caption",
                                                style: { fontStyle: "italic" },
                                            }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Box>
                )}
            </CardContent>

            <CardActions>
                <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                    {(previewData || uploadResults) && <Button onClick={clearAll}>Clear</Button>}
                    <Button
                        variant="contained"
                        startIcon={<FileUpload />}
                        onClick={handleUpload}
                        disabled={!previewData || uploading}>
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </Stack>
            </CardActions>
        </Card>
    );
};

export default TranslationFileUpload;
