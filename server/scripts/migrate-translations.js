import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, "../translations"); // Git repo location
// Use local development path when TRANSLATIONS_PATH is not set (development mode)
const targetDir = process.env.TRANSLATIONS_PATH || path.join(__dirname, "../runtime/translations"); // Development: local runtime folder, Production: persistent volume

async function migrateTranslations() {
    try {
        console.log("Starting translation migration...");
        console.log(`Source: ${sourceDir}`);
        console.log(`Target: ${targetDir}`);

        // Check if target directory exists and has content
        try {
            const targetStats = await fs.stat(targetDir);
            if (targetStats.isDirectory()) {
                const targetContents = await fs.readdir(targetDir);
                if (targetContents.length > 0) {
                    console.log("✓ Translations already migrated - target directory has content");
                    return;
                }
            }
        } catch (error) {
            // Target doesn't exist, continue with migration
            console.log("Target directory does not exist, proceeding with migration...");
        }

        // Check if source directory exists
        try {
            await fs.access(sourceDir);
        } catch (error) {
            console.log("⚠ Source translations directory not found, creating empty target structure...");
            await createEmptyTranslationStructure();
            return;
        }

        // Ensure target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Copy all translation files
        await fs.cp(sourceDir, targetDir, { recursive: true });
        console.log("✓ Translations migrated successfully");

        // Verify migration
        const targetContents = await fs.readdir(targetDir);
        console.log(`✓ Migration verified - target contains: ${targetContents.join(", ")}`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

async function createEmptyTranslationStructure() {
    const languages = ["en", "fr", "es"];
    const namespaces = [
        "auth",
        "common",
        "home",
        "map",
        "navigation",
        "onboarding",
        "profile",
        "events",
        "bookings",
        "payments",
    ];

    for (const lang of languages) {
        const langDir = path.join(targetDir, lang);
        await fs.mkdir(langDir, { recursive: true });

        for (const namespace of namespaces) {
            const filePath = path.join(langDir, `${namespace}.json`);
            await fs.writeFile(filePath, "{}", "utf8");
        }
    }
    console.log("✓ Empty translation structure created");
}

// Run migration
migrateTranslations().catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
});
