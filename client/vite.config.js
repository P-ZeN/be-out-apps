import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), "");

    // For mobile builds, ensure we have the production values
    const apiUrl =
        env.VITE_API_URL ||
        (mode === "production" ? "https://server.be-out-app.dedibox2.philippezenone.net" : "http://localhost:3000");
    const mapboxToken =
        env.VITE_MAPBOX_ACCESS_TOKEN ||
        "pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw";

    console.log("Build mode:", mode);
    console.log("API URL:", apiUrl);
    console.log("Mapbox token:", mapboxToken ? "SET" : "NOT SET");

    return {
        plugins: [react()],
        json: {
            namedExports: false,
            stringify: false,
        },
        // Environment variables configuration
        envPrefix: "VITE_",
        envDir: ".", // Look for .env files in the client directory

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
            rollupOptions: {
                external: [/^@tauri-apps\/api\/.*/],
            },
        },
        // Define environment variables for different environments
        define: {
            // Make sure environment variables are available at build time
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || mode),
            // Explicitly define VITE environment variables with fallbacks
            "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
            "import.meta.env.VITE_MAPBOX_ACCESS_TOKEN": JSON.stringify(mapboxToken),
            // Also define them as process.env for compatibility
            "process.env.VITE_API_URL": JSON.stringify(apiUrl),
            "process.env.VITE_MAPBOX_ACCESS_TOKEN": JSON.stringify(mapboxToken),
        },
    };
});
