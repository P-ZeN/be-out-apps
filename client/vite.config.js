import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    json: {
        namedExports: false,
        stringify: false,
    },
    // Tauri expects a fixed port, disable hmr in production
    server: {
        port: 5173,
        strictPort: true,
    },
    // Build configuration for both web and Tauri
    build: {
        outDir: "build", // Changed from dist to build for Tauri
        target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        sourcemap: !!process.env.TAURI_DEBUG,
    },
});
