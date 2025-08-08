import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useExternalLink } from "../hooks/useExternalLink";
import { waitForTauri, getTauriInfo } from "../utils/tauriReady";
import { areTauriApisAvailable } from "../utils/platformDetection";
import { Button, TextField, Container, Typography, Box, Alert, Divider, CircularProgress } from "@mui/material";
import { Google, Facebook, Apple } from "@mui/icons-material";
import WebViewOverlay from "./WebViewOverlay";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const { login, nativeLogin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(["auth", "common"]);
    const { openExternalLink, closeWebView, webViewState, isTauriApp } = useExternalLink();

    // Dynamic access to Tauri invoke function using internals
    const getTauriInvoke = () => {
        try {
            // Try to access Tauri invoke through window.__TAURI_INTERNALS__
            if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
                console.log('Using Tauri internals invoke function');
                return {
                    invoke: window.__TAURI_INTERNALS__.invoke
                };
            }

            // Fallback to window.__TAURI_INTERNALS__.ipc if available
            if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.ipc) {
                console.log('Using Tauri internals IPC for invoke');
                return {
                    invoke: async (cmd, payload) => {
                        return new Promise((resolve, reject) => {
                            try {
                                const result = window.__TAURI_INTERNALS__.ipc({
                                    cmd: cmd,
                                    payload: payload || {}
                                });
                                resolve(result);
                            } catch (error) {
                                reject(error);
                            }
                        });
                    }
                };
            }

            console.log('No Tauri invoke method available');
            return null;
        } catch (error) {
            console.log('Error accessing Tauri invoke:', error);
            return null;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setIsLoading(true);
        try {
            const response = await authService.login({ email, password });
            login(response); // AuthContext will handle navigation based on onboarding status
            setMessage(t("auth:login.success"));
        } catch (error) {
            setError(t("auth:login.failed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setOauthLoading(true);
        try {
            console.log('Beginning detection of type of environment');

            // Debug: Log all the Tauri-related properties
            console.log('Debug - window.__TAURI__:', typeof window.__TAURI__, window.__TAURI__);
            console.log('Debug - window.__TAURI_IPC__:', typeof window.__TAURI_IPC__, window.__TAURI_IPC__);
            console.log('Debug - window.__TAURI_INTERNALS__:', typeof window.__TAURI_INTERNALS__, window.__TAURI_INTERNALS__);
            console.log('Debug - window.ipc:', typeof window.ipc, window.ipc);
            console.log('Debug - window.rpc:', typeof window.rpc, window.rpc);
            console.log('Debug - areTauriApisAvailable():', areTauriApisAvailable());
            console.log('Debug - window.AndroidGoogleSignIn:', typeof window.AndroidGoogleSignIn, window.AndroidGoogleSignIn);

            // Debug: Check available Tauri plugins
            if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.plugins) {
                console.log('Debug - Available Tauri plugins:', Object.keys(window.__TAURI_INTERNALS__.plugins));
            }

            // Set up a global function that MainActivity can call to confirm interface setup
            window.onAndroidInterfaceReady = function() {
                console.log('Android interface ready callback triggered');
                window.isAndroidGoogleSignInReady = true;
            };

            // Function to wait for AndroidGoogleSignIn interface
            const waitForAndroidInterface = (timeout = 1000) => {
                return new Promise((resolve) => {
                    if (window.AndroidGoogleSignIn) {
                        resolve(true);
                        return;
                    }

                    console.log('AndroidGoogleSignIn not immediately available, waiting...');

                    // Try to trigger interface setup manually
                    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.ipc) {
                        console.log('Attempting to trigger Android interface setup...');
                        try {
                            // Try to call a setup method if available
                            window.__TAURI_INTERNALS__.ipc.postMessage && window.__TAURI_INTERNALS__.ipc.postMessage({
                                cmd: 'setup_javascript_interface',
                                data: {}
                            });
                        } catch (e) {
                            console.log('Could not trigger interface setup:', e);
                        }
                    }

                    let elapsed = 0;
                    const interval = 100; // Check every 100ms

                    const checkInterval = setInterval(() => {
                        elapsed += interval;
                        if (window.AndroidGoogleSignIn) {
                            console.log(`AndroidGoogleSignIn became available after ${elapsed}ms`);
                            clearInterval(checkInterval);
                            resolve(true);
                        } else if (elapsed >= timeout) {
                            console.log(`AndroidGoogleSignIn not available after ${timeout}ms timeout`);
                            clearInterval(checkInterval);
                            resolve(false);
                        }
                    }, interval);
                });
            };

            // Check for Android interface first, with retry mechanism
            const hasAndroidInterface = await waitForAndroidInterface();
            if (hasAndroidInterface) {
                console.log('Environment detected: Android (AndroidGoogleSignIn interface available)');
                console.log('=== GOOGLE OAUTH START (Android Interface) ===');                return new Promise((resolve, reject) => {
                    try {
                        console.log('Android interface detected, checking availability...');
                        console.log('window.AndroidGoogleSignIn:', window.AndroidGoogleSignIn);
                        console.log('typeof window.AndroidGoogleSignIn:', typeof window.AndroidGoogleSignIn);

                        console.log('Testing Android interface...');
                        const testResult = window.AndroidGoogleSignIn.testInterface();
                        console.log('Android interface test result:', testResult);

                        // Set up global callbacks for the result
                        window.onGoogleSignInSuccess = async function(result) {
                            console.log('Android Google Sign-in success callback triggered:', result);

                            if (result.success && result.user) {
                                try {
                                    // Process the token with our backend
                                    const authResult = await authService.loginWithGoogleMobile(result.user.idToken);
                                    if (authResult.token) {
                                        await nativeLogin(authResult.token, authResult.user);
                                        setMessage(t("auth:login.success"));
                                        resolve();
                                    } else {
                                        setError('Failed to authenticate with server');
                                        resolve();
                                    }
                                } catch (error) {
                                    console.error('Backend authentication error:', error);
                                    setError('Server authentication failed');
                                    resolve();
                                }
                            } else {
                                setError('Invalid sign-in result');
                                resolve();
                            }
                        };

                        window.onGoogleSignInError = function(result) {
                            console.error('Android Google Sign-in error callback triggered:', result);
                            setError(result.error || 'Android sign-in failed');
                            resolve();
                        };

                        // Start the sign-in process
                        console.log('Starting Android Google Sign-in...');
                        window.AndroidGoogleSignIn.signIn();
                        console.log('Android Sign-in method called');

                        // Set a timeout in case nothing happens
                        setTimeout(() => {
                            console.error('Android sign-in timeout - no response received');
                            setError('Sign-in timeout - no response from Android');
                            resolve();
                        }, 30000); // 30 second timeout

                    } catch (error) {
                        console.error('Error in Android Google Sign-in:', error);
                        setError(error.toString());
                        resolve();
                    }
                });

                // Return early since we handled Android interface
                return;
            }

            // Continue with Tauri plugin or Web flow
            if (areTauriApisAvailable()) {
                // Native mobile flow using our new google-signin plugin
                console.log('Environment detected: Tauri (Tauri APIs available)');
                console.log("=== GOOGLE OAUTH START (Tauri) ===");

                // Generate a random nonce for security
                const nonce = Math.random().toString(36).substring(2, 15);

                // Get the invoke function using internals
                const invokeApi = getTauriInvoke();
                if (!invokeApi || !invokeApi.invoke) {
                    throw new Error('Tauri invoke function not available');
                }

                // First try our new custom google-auth plugin
                console.log('Trying our custom google-auth plugin...');
                try {
                    // Use correct payload structure that matches the plugin expectations
                    const result = await invokeApi.invoke('plugin:google-auth|google_sign_in', {
                        filterByAuthorizedAccounts: false,
                        autoSelectEnabled: false,
                        nonce: nonce
                    });

                    console.log("Google sign-in result:", result);

                    if (result.success) {
                        console.log("Google sign-in successful for mobile - using profile data");

                        // For mobile Android sign-in, we don't get an ID token
                        // Instead, we send the user profile data directly to the backend
                        if (result.idToken) {
                            // If we have an ID token, use the normal flow
                            const response = await authService.loginWithGoogleMobile(result.idToken);
                            await nativeLogin(response.token, response.user);
                        } else {
                            // For native Android sign-in, send profile data directly
                            const response = await authService.loginWithGoogleProfileMobile({
                                email: result.email,
                                displayName: result.displayName,
                                givenName: result.givenName,
                                familyName: result.familyName,
                                profilePictureUri: result.profilePictureUri
                            });
                            await nativeLogin(response.token, response.user);
                        }

                        setMessage(t("auth:login.success"));
                        return;
                    } else {
                        throw new Error(result.error || "Google Sign-In failed.");
                    }
                } catch (pluginError) {
                    console.log('Plugin invocation failed:', pluginError);

                    // Check if this is due to plugin being disabled (temporary fix for iOS crashes)
                    if (pluginError.message && (
                        pluginError.message.includes('unknown command') ||
                        pluginError.message.includes('not found') ||
                        pluginError.message.includes('plugin not loaded')
                    )) {
                        console.log('Google Auth plugin temporarily disabled - using fallback OAuth flow');
                        setError('Google Sign-in temporarily unavailable. Please use the web OAuth flow or try again later.');
                        // TODO: Fall back to desktop OAuth flow or show alternative sign-in options
                        return;
                    } else {
                        setError('Google Sign-in plugin failed: ' + pluginError.message);
                        return;
                    }
                }
            } else {
                // Web flow
                console.log('Environment detected: Web (no Tauri APIs, no Android interface)');
                console.log("=== GOOGLE OAUTH START (Web) ===");
                const googleAuthUrl = `${API_BASE_URL}/api/oauth/google/login`;
                window.location.href = googleAuthUrl;
            }
        } catch (error) {
            console.error("Google OAuth error:", error);
            setError("Google authentication failed: " + (error.message || "Unknown error"));
        } finally {
            setOauthLoading(false);
        }
    };
    const handleFacebookLogin = () => {
        const facebookAuthUrl = `${API_BASE_URL}/auth/facebook`;
        if (isTauriApp) {
            openExternalLink(facebookAuthUrl, "Facebook Login");
        } else {
            window.location.href = facebookAuthUrl;
        }
    };

    const handleAppleLogin = async () => {
        setMessage("");
        setError("");
        setOauthLoading(true);

        try {
            if (isTauriApp) {
                console.log("Apple Sign-In not yet implemented for native auth");
                setError("Apple Sign-In will be available in a future update");
                // TODO: Implement Apple Sign-In in native auth service
            } else {
                console.log("Using web browser redirect for Apple");
                const appleAuthUrl = `${API_BASE_URL}/auth/apple`;
                window.location.href = appleAuthUrl;
            }
        } catch (error) {
            console.error("Apple Sign In error:", error);
            setError(error.message || "Apple Sign In failed");
        } finally {
            setOauthLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}>
                <Typography component="h1" variant="h5">
                    {t("auth:login.title")}
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={t("common:form.email")}
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={t("common:form.password")}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : t("auth:login.title")}
                    </Button>
                </Box>
            </Box>
            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            <Divider sx={{ my: 2 }}>{t("auth:login.orLoginWith")}</Divider>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={oauthLoading ? <CircularProgress size={20} /> : <Google />}
                    onClick={handleGoogleLogin}
                    disabled={oauthLoading || isLoading}>
                    {oauthLoading ? t("auth:login.authenticating") : t("auth:login.loginWithGoogle")}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Apple />}
                    onClick={handleAppleLogin}
                    disabled={oauthLoading || isLoading}>
                    Sign in with Apple
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Facebook />}
                    onClick={handleFacebookLogin}
                    disabled={oauthLoading || isLoading}>
                    {t("auth:login.loginWithFacebook")}
                </Button>
            </Box>

            {/* WebView Overlay for mobile external links */}
            <WebViewOverlay
                url={webViewState.url}
                title={webViewState.title}
                open={webViewState.open}
                onClose={closeWebView}
            />
        </Container>
    );
};

export default Login;
