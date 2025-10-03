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
    TextField,
} from "@mui/material";
import { PhotoCamera, Delete, ZoomIn, CloudUpload, Link } from "@mui/icons-material";
import fileService from "../services/fileService";

const ContentImageUpload = ({ currentImage, onImageChange, height = 200, label = "Image mise en avant" }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [urlMode, setUrlMode] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner un fichier image");
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError("La taille du fichier doit être inférieure à 10MB");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const result = await fileService.uploadContentImage(file);
            console.log("Upload result:", result); // Debug log
            
            // Return the large size image URL if available, otherwise the first one
            const imageUrl = result.files?.find((f) => f.size === "large")?.fileUrl || 
                           result.files?.[0]?.fileUrl ||
                           result.file?.fileUrl || 
                           result.fileUrl ||
                           currentImage;
            
            console.log("Selected image URL:", imageUrl); // Debug log
            
            if (imageUrl && imageUrl !== currentImage) {
                onImageChange(imageUrl);
            } else {
                setError("Aucune URL d'image valide reçue");
            }
        } catch (err) {
            console.error("Upload error:", err); // Debug log
            setError(err.message || "Échec du téléchargement de l'image");
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
            onImageChange("");
        } catch (err) {
            setError(err.message || "Échec de la suppression de l'image");
        }
    };

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onImageChange(urlInput.trim());
            setUrlInput("");
            setUrlMode(false);
        }
    };

    const handleUrlCancel = () => {
        setUrlInput("");
        setUrlMode(false);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                {label}
            </Typography>

            {urlMode ? (
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="URL de l'image"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        size="small"
                        sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button 
                            variant="contained" 
                            size="small" 
                            onClick={handleUrlSubmit}
                            disabled={!urlInput.trim()}
                        >
                            Valider
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={handleUrlCancel}
                        >
                            Annuler
                        </Button>
                    </Box>
                </Box>
            ) : (
                <>
                    {currentImage ? (
                        <Card sx={{ position: "relative", mb: 2 }}>
                            <CardMedia
                                component="img"
                                height={height}
                                image={currentImage}
                                alt="Image de contenu"
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
                                    Changer l'image
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
                                mb: 2,
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
                                            Télécharger une image
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" textAlign="center">
                                            Cliquez pour sélectionner une image
                                            <br />
                                            Taille maximale : 10MB
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                        </Card>
                    )}

                    {/* Action buttons */}
                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            size="small"
                        >
                            Télécharger
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Link />}
                            onClick={() => setUrlMode(true)}
                            disabled={uploading}
                            size="small"
                        >
                            Utiliser une URL
                        </Button>
                    </Box>
                </>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: "none" }}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Aperçu de l'image</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <img
                            src={currentImage}
                            alt="Aperçu"
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
                    <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ContentImageUpload;
