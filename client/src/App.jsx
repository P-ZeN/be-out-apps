import { HashRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppRoutes from "./components/AppRoutes";
import Header from "./components/Header";
import Footer from "./components/Footer";
// import PlatformDebug from "./components/PlatformDebug"; // Temporarily disabled - might be causing red indicator
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebViewProvider } from "./context/WebViewContext";
import { theme } from "./theme";
import { getIsTauriApp } from "./utils/platformDetection";
import { isAndroid } from "./utils/platform";
// import { getSafeAreaInsets, applySafeAreaInsets } from "./utils/safeAreaUtils"; // Disabled - using CSS approach
import { useAutoHideSplashScreen } from "./hooks/useSplashScreen";
import "./App.css";
import { useEffect } from "react";

// Build timestamp for deployment verification
console.log("App build timestamp:", "2025-07-29-10:00");

const AppContent = () => {
    const { loginWithToken } = useAuth();

    // Hide splash screen when app is ready
    useAutoHideSplashScreen(1200); // Wait 1.2 seconds to ensure smooth loading

    // Add mobile class for Tauri apps to handle safe areas
    useEffect(() => {
        const isTauriApp = getIsTauriApp();
        console.log('🔍 Platform Detection Debug:', {
            isTauriApp,
            userAgent: navigator.userAgent,
            location: window.location.href,
            tauriApis: {
                __TAURI__: !!window.__TAURI__,
                __TAURI_IPC__: !!window.__TAURI_IPC__,
                __TAURI_INTERNALS__: !!window.__TAURI_INTERNALS__
            }
        });

        if (isTauriApp) {
            document.body.classList.add('tauri-mobile');
            console.log('✅ Added tauri-mobile class to body for proper mobile safe area handling');

            // For Android: Apply dynamic content padding to ensure content appears below AppBar
            if (isAndroid()) {
                console.log('📱 Android Tauri detected - setting up dynamic content padding');

                // Calculate status bar height using the same method as MainMenu
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'fixed';
                tempDiv.style.top = 'env(safe-area-inset-top, 0px)';
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.pointerEvents = 'none';
                document.body.appendChild(tempDiv);

                const computedStyle = getComputedStyle(tempDiv);
                const topValue = computedStyle.top;
                document.body.removeChild(tempDiv);

                let statusBarHeight = 0;
                if (topValue && topValue !== '0px' && !topValue.includes('env(')) {
                    statusBarHeight = parseInt(topValue, 10) || 0;
                } else {
                    // Fallback for Android
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    statusBarHeight = Math.round(24 * devicePixelRatio);
                }

                // Apply dynamic padding to main content
                const updateContentPadding = () => {
                    const mainContent = document.querySelector('.main-content');
                    if (mainContent) {
                        const isMobile = window.innerWidth <= 600;
                        const appBarHeight = isMobile ? 64 : 72;
                        const totalTopPadding = statusBarHeight + appBarHeight;

                        mainContent.style.paddingTop = `${totalTopPadding}px`;
                        console.log(`✅ Android: Set content padding-top to ${totalTopPadding}px (${statusBarHeight}px status bar + ${appBarHeight}px AppBar)`);
                    }

                    // Also update the orange background height
                    const style = document.createElement('style');
                    style.textContent = `
                        body.tauri-mobile::before {
                            height: ${statusBarHeight + (window.innerWidth <= 600 ? 64 : 72)}px !important;
                        }
                    `;
                    // Remove existing style if any
                    const existingStyle = document.getElementById('android-dynamic-style');
                    if (existingStyle) {
                        existingStyle.remove();
                    }
                    style.id = 'android-dynamic-style';
                    document.head.appendChild(style);
                };

                // Apply immediately and on resize
                updateContentPadding();
                window.addEventListener('resize', updateContentPadding);

                // Cleanup function
                return () => {
                    window.removeEventListener('resize', updateContentPadding);
                    document.body.classList.remove('tauri-mobile');
                };
            }
        } else {
            console.log('ℹ️ Not a Tauri app - using web layout');
        }

        return () => {
            document.body.classList.remove('tauri-mobile');
        };
    }, []);

    const handleDeepLink = (url) => {
        if (url && url.startsWith("beout://oauth/success")) {
            try {
                // The URL might not be a full valid URL, so we need to handle it carefully.
                // We can create a dummy base to parse it.
                const urlObj = new URL(url, "http://localhost");
                const token = urlObj.searchParams.get("token");
                if (token) {
                    console.log("OAuth token received via deep link, logging in...");
                    loginWithToken(token);
                } else {
                    console.error("Deep link URL did not contain a token.");
                }
            } catch (error) {
                console.error("Failed to parse deep link URL:", error);
            }
        }
    };

    useEffect(() => {
        let unlisten;

        const setupDeepLinkListeners = async () => {
            try {
                // Listen for deep links when app is already running
                unlisten = await window.__TAURI__.event.listen("deep-link://new-url", (event) => {
                    handleDeepLink(event.payload);
                });

                // Check for initial deep link that launched the app
                const initialUrl = await window.__TAURI__.tauri.invoke("plugin:deep-link|get_initial_url");
                if (initialUrl) {
                    handleDeepLink(initialUrl);
                }
            } catch (error) {
                console.error("Failed to set up deep link listeners:", error);
            }
        };

        // Only run this setup in a Tauri environment
        if (window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.tauri) {
            setupDeepLinkListeners();
        }

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, [loginWithToken]);

    return (
        <>
            {/* <PlatformDebug /> */}
            <Header />
            <div className="main-content">
                <AppRoutes />
            </div>
            <Footer />
        </>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <WebViewProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <AppContent />
                    </ThemeProvider>
                </WebViewProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
