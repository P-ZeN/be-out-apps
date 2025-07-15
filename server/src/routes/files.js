import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

// File service class
class LocalFileService {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads");
        this.publicUrl = process.env.PUBLIC_FILES_URL || "http://localhost:3000/uploads";
        this.initializeDirectories();
    }

    async initializeDirectories() {
        const directories = [
            "public/avatars",
            "public/events",
            "public/thumbnails",
            "private/documents",
            "private/temp",
        ];

        for (const dir of directories) {
            const fullPath = path.join(this.uploadPath, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (error) {
                console.error(`Error creating directory ${fullPath}:`, error);
            }
        }
    }

    async saveFile(file, folder = "uploads", isPublic = false) {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const subFolder = isPublic ? "public" : "private";
            const relativePath = path.join(subFolder, folder, fileName);
            const fullPath = path.join(this.uploadPath, relativePath);

            // Ensure directory exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            // Save file
            await fs.writeFile(fullPath, file.buffer);

            // Generate URL
            const fileUrl = isPublic ? `${this.publicUrl}/${relativePath.replace(/\\/g, "/")}` : null;

            return {
                fileName: relativePath.replace(/\\/g, "/"),
                fileUrl,
                size: file.size,
                mimetype: file.mimetype,
                originalName: file.originalname,
            };
        } catch (error) {
            console.error("Error saving file:", error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            const fullPath = path.join(this.uploadPath, fileName);
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }

    getPublicUrl(fileName) {
        return `${this.publicUrl}/${fileName}`;
    }
}

const fileService = new LocalFileService();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only images and PDFs are allowed"), false);
        }
    },
});

// Upload avatar
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        // Resize and optimize image
        const processedImage = await sharp(req.file.buffer)
            .resize(200, 200, { fit: "cover" })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Create processed file object
        const processedFile = {
            ...req.file,
            buffer: processedImage,
            originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
            mimetype: "image/jpeg",
        };

        const result = await fileService.saveFile(processedFile, "avatars", true);

        res.json({
            message: "Avatar uploaded successfully",
            file: result,
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
});

// Upload event image
router.post("/event-image", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        // Create multiple sizes
        const sizes = [
            { width: 1200, height: 800, suffix: "large" },
            { width: 600, height: 400, suffix: "medium" },
            { width: 300, height: 200, suffix: "thumbnail" },
        ];

        const results = [];

        for (const size of sizes) {
            const processedImage = await sharp(req.file.buffer)
                .resize(size.width, size.height, { fit: "cover" })
                .jpeg({ quality: 90 })
                .toBuffer();

            const processedFile = {
                ...req.file,
                buffer: processedImage,
                originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + `_${size.suffix}.jpg`,
                mimetype: "image/jpeg",
            };

            const result = await fileService.saveFile(processedFile, "events", true);
            results.push({
                size: size.suffix,
                ...result,
            });
        }

        res.json({
            message: "Event images uploaded successfully",
            files: results,
        });
    } catch (error) {
        console.error("Error uploading event image:", error);
        res.status(500).json({ error: "Failed to upload event image" });
    }
});

// Upload document (private)
router.post("/document", authenticateToken, upload.single("document"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const result = await fileService.saveFile(req.file, "documents", false);

        res.json({
            message: "Document uploaded successfully",
            file: result,
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// Delete file
router.delete("/:fileName(*)", authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        await fileService.deleteFile(fileName);

        res.json({
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

export default router;
