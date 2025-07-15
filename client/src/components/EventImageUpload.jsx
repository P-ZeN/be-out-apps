import React, { useState, useRef } from "react";
import {
    Box,
    Button,
    Card,
    CardMedia,
    CardActions,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Stack,
} from "@mui/material";
import { PhotoCamera, Delete, ZoomIn, CloudUpload } from "@mui/icons-material";
import fileService from "../services/fileService";

const EventImageUpload = ({ currentImage, onImageChange, height = 200 }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const result = await fileService.uploadEventImage(file);
            // Return the large size image URL
            const largeImage = result.files.find((f) => f.size === "large");
            onImageChange(largeImage?.fileUrl || result.files[0]?.fileUrl, result.files);
        } catch (err) {
            setError(err.message || "Failed to upload event image");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!currentImage) return;

        try {
            // Extract filename from URL if needed
            const fileName = currentImage.split("/uploads/")[1];
            if (fileName) {
                await fileService.deleteFile(fileName);
            }
            onImageChange(null, []);
        } catch (err) {
            setError(err.message || "Failed to delete image");
        }
    };

    return (
        <Box sx={{ width: "100%" }}>
            {currentImage ? (
                <Card sx={{ position: "relative" }}>
                    <CardMedia
                        component="img"
                        height={height}
                        image={currentImage}
                        alt="Event image"
                        sx={{
                            cursor: "pointer",
                            objectFit: "cover",
                        }}
                        onClick={() => setPreviewOpen(true)}
                    />

                    {uploading && (
                        <Box
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "white",
                            }}>
                            <CircularProgress color="inherit" />
                        </Box>
                    )}

                    <CardActions sx={{ justifyContent: "space-between", p: 1 }}>
                        <Button
                            size="small"
                            startIcon={<PhotoCamera />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}>
                            Change Image
                        </Button>

                        <Box>
                            <IconButton size="small" onClick={() => setPreviewOpen(true)} disabled={uploading}>
                                <ZoomIn />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={handleDeleteImage} disabled={uploading}>
                                <Delete />
                            </IconButton>
                        </Box>
                    </CardActions>
                </Card>
            ) : (
                <Card
                    sx={{
                        height: height,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "grey.100",
                        border: "2px dashed",
                        borderColor: "grey.300",
                        cursor: "pointer",
                        "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: "grey.50",
                        },
                    }}
                    onClick={() => fileInputRef.current?.click()}>
                    <Stack alignItems="center" spacing={2}>
                        {uploading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                <CloudUpload sx={{ fontSize: 48, color: "grey.400" }} />
                                <Typography variant="h6" color="text.secondary">
                                    Upload Event Image
                                </Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Click to select an image
                                    <br />
                                    Maximum file size: 10MB
                                </Typography>
                            </>
                        )}
                    </Stack>
                </Card>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: "none" }}
            />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Event Image Preview</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <img
                            src={currentImage}
                            alt="Event"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "500px",
                                height: "auto",
                                borderRadius: "8px",
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventImageUpload;
