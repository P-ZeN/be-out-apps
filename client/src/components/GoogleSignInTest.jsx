import React, { useState } from "react";
import { Button, Container, Typography, Box, Alert, CircularProgress } from "@mui/material";
import { Google } from "@mui/icons-material";
import { areTauriApisAvailable } from "../utils/platformDetection";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const GoogleSignInTest = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { nativeLogin } = useAuth();
    const { t } = useTranslation(["auth", "common"]);

    const isTauriAvailable = areTauriApisAvailable();

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        setResult(null);

        try {
            if (isTauriAvailable) {
                console.log("=== GOOGLE SIGNIN TEST (Tauri) ===");

                // For testing, use a fixed nonce that will help us debug
                const nonce = "test_nonce_" + Date.now();

                console.log("Invoking plugin:google-signin|googleSignIn");

                // Call the mobile plugin command directly
                const result = await window.__TAURI__.invoke('plugin:google-signin|googleSignIn', {});

                console.log("Raw Google sign-in result:", result);
                setResult(result);

                if (result && result.success && result.user && result.user.idToken) {
                    try {
                        // Try to authenticate with backend
                        console.log("Authenticating with backend using ID token");
                        const response = await authService.loginWithGoogleMobile(result.user.idToken);
                        console.log("Backend authentication response:", response);

                        // Store the authentication
                        nativeLogin(response.token, response.user);
                        setResult({
                            ...result,
                            backendResponse: {
                                success: true,
                                user: response.user
                            }
                        });
                    } catch (backendError) {
                        console.error("Backend authentication failed:", backendError);
                        setResult({
                            ...result,
                            backendResponse: {
                                success: false,
                                error: backendError.message || "Backend authentication failed"
                            }
                        });
                    }
                } else {
                    throw new Error(result?.error || "Google Sign-In failed");
                }
            } else {
                setError("Tauri APIs not available - this test is for Tauri apps only");
            }
        } catch (error) {
            console.error("Google sign-in test error:", error);
            setError(error.message || "Failed to test Google Sign-In");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Google Sign-In Test
            </Typography>

            <Box sx={{ my: 2 }}>
                <Typography variant="body1" gutterBottom>
                    This is a test component for the Google Sign-In plugin.
                </Typography>

                <Typography variant="body2" gutterBottom>
                    Tauri API Status: {isTauriAvailable ? "Available ✅" : "Not Available ❌"}
                </Typography>

                {!isTauriAvailable && (
                    <Alert severity="warning" sx={{ my: 2 }}>
                        This test component only works in a Tauri bundled app.
                    </Alert>
                )}

                <Box sx={{ my: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Google />}
                        onClick={handleGoogleSignIn}
                        disabled={!isTauriAvailable || loading}
                        fullWidth
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            "Test Google Sign-In"
                        )}
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                )}

                {result && (
                    <Box sx={{ my: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Sign-In Result:
                        </Typography>
                        <pre style={{
                            overflow: "auto",
                            maxHeight: "300px",
                            backgroundColor: "#f5f5f5",
                            padding: "8px",
                            borderRadius: "4px"
                        }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>

                        {result.success ? (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Google Sign-In Successful!
                            </Alert>
                        ) : (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Google Sign-In Failed: {result.error || "Unknown error"}
                            </Alert>
                        )}

                        {result.backendResponse && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Backend Authentication:
                                </Typography>
                                {result.backendResponse.success ? (
                                    <Alert severity="success">
                                        Backend authentication successful! Welcome {result.backendResponse.user?.name || "User"}
                                    </Alert>
                                ) : (
                                    <Alert severity="error">
                                        Backend authentication failed: {result.backendResponse.error || "Unknown error"}
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default GoogleSignInTest;
