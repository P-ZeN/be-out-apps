import React, { useState, useRef } from "react";
import {
    Box,
    Avatar,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from "@mui/material";
import { PhotoCamera, Delete, ZoomIn } from "@mui/icons-material";
import fileService from "../services/fileService";

const AvatarUpload = ({ currentAvatar, onAvatarChange, size = 100 }) => {
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

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const result = await fileService.uploadAvatar(file);
            onAvatarChange(result.file.fileUrl);
        } catch (err) {
            setError(err.message || "Failed to upload avatar");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!currentAvatar) return;

        try {
            // Extract filename from URL if needed
            const fileName = currentAvatar.split("/uploads/")[1];
            if (fileName) {
                await fileService.deleteFile(fileName);
            }
            onAvatarChange(null);
        } catch (err) {
            setError(err.message || "Failed to delete avatar");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative" }}>
                <Avatar
                    src={currentAvatar}
                    sx={{
                        width: size,
                        height: size,
                        cursor: currentAvatar ? "pointer" : "default",
                        border: "3px solid",
                        borderColor: "divider",
                    }}
                    onClick={() => currentAvatar && setPreviewOpen(true)}
                />

                {uploading && (
                    <CircularProgress
                        size={size}
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                        }}
                    />
                )}

                <IconButton
                    color="primary"
                    sx={{
                        position: "absolute",
                        bottom: -8,
                        right: -8,
                        backgroundColor: "background.paper",
                        boxShadow: 2,
                        "&:hover": {
                            backgroundColor: "primary.light",
                            color: "white",
                        },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}>
                    <PhotoCamera />
                </IconButton>

                {currentAvatar && (
                    <>
                        <IconButton
                            color="error"
                            sx={{
                                position: "absolute",
                                bottom: -8,
                                left: -8,
                                backgroundColor: "background.paper",
                                boxShadow: 2,
                                "&:hover": {
                                    backgroundColor: "error.light",
                                    color: "white",
                                },
                            }}
                            onClick={handleDeleteAvatar}
                            disabled={uploading}>
                            <Delete />
                        </IconButton>

                        <IconButton
                            color="info"
                            sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                backgroundColor: "background.paper",
                                boxShadow: 2,
                                "&:hover": {
                                    backgroundColor: "info.light",
                                    color: "white",
                                },
                            }}
                            onClick={() => setPreviewOpen(true)}
                            disabled={uploading}>
                            <ZoomIn />
                        </IconButton>
                    </>
                )}
            </Box>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: "none" }}
            />

            <Typography variant="caption" color="text.secondary" textAlign="center">
                Click the camera icon to upload a new avatar
                <br />
                Maximum file size: 5MB
            </Typography>

            {error && (
                <Alert severity="error" sx={{ width: "100%", maxWidth: 300 }}>
                    {error}
                </Alert>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Avatar Preview</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <img
                            src={currentAvatar}
                            alt="Avatar"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "400px",
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

export default AvatarUpload;
