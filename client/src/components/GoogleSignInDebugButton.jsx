import React, { useState, useEffect } from 'react';
import { Button, Alert, Box, Typography } from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { areTauriApisAvailable } from '../utils/platformDetection';
import authService from '../services/authService';
import remoteLogger from '../services/remoteLoggerService';

const GoogleSignInDebugButton = ({ onSuccess, onError, disabled }) => {
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState([]);
    const { nativeLogin } = useAuth();
    const { t } = useTranslation(['auth']);

    const addDebugInfo = (message, level = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const info = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        setDebugInfo(prev => [...prev, info]);

        // Send to remote logger
        remoteLogger.googleAuthStep(`DEBUG_${level.toUpperCase()}`, message);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setDebugInfo([]);

        try {
            addDebugInfo('Starting Google Sign-In process');

            // Check environment
            const isTauri = areTauriApisAvailable();
            addDebugInfo(`Environment: ${isTauri ? 'Tauri' : 'Web'}`);

            if (!isTauri) {
                addDebugInfo('Not in Tauri environment - cannot test mobile plugin', 'error');
                onError('This test component is for Tauri mobile apps only');
                return;
            }

            // Check if Tauri APIs are available
            addDebugInfo('Checking Tauri APIs...');
            if (!window.__TAURI__ || !window.__TAURI__.invoke) {
                addDebugInfo('Tauri invoke API not available', 'error');
                onError('Tauri APIs not available');
                return;
            }

            addDebugInfo('Tauri APIs available, proceeding with plugin call');

            // Generate nonce
            const nonce = `debug_${Date.now()}`;
            addDebugInfo(`Generated nonce: ${nonce}`);

            // Test plugin availability first
            addDebugInfo('Testing plugin with ping...');
            try {
                const pingResult = await window.__TAURI__.invoke('plugin:google-auth|ping', {
                    payload: { value: 'debug_test' }
                });
                addDebugInfo(`Ping successful: ${JSON.stringify(pingResult)}`);
            } catch (pingError) {
                addDebugInfo(`Ping failed: ${pingError.message}`, 'error');
                onError(`Plugin not available: ${pingError.message}`);
                return;
            }

            // Attempt Google Sign-In
            addDebugInfo('Calling Google Sign-In plugin...');
            const result = await window.__TAURI__.invoke('plugin:google-auth|google_sign_in', {
                payload: {
                    filterByAuthorizedAccounts: false,
                    autoSelectEnabled: false,
                    nonce: nonce
                }
            });

            addDebugInfo(`Plugin response received: ${JSON.stringify(result, null, 2)}`);

            if (result.success) {
                addDebugInfo('Plugin returned success, processing authentication...');

                if (result.idToken) {
                    addDebugInfo('ID token available, authenticating with backend...');
                    try {
                        const authResult = await authService.loginWithGoogleMobile(result.idToken);
                        addDebugInfo(`Backend authentication successful: ${JSON.stringify({
                            hasToken: !!authResult.token,
                            userComplete: authResult.user?.onboarding_complete
                        })}`);

                        await nativeLogin(authResult.token, authResult.user);
                        addDebugInfo('Native login completed successfully');
                        onSuccess(authResult);
                    } catch (backendError) {
                        addDebugInfo(`Backend authentication failed: ${backendError.message}`, 'error');
                        onError(`Backend authentication failed: ${backendError.message}`);
                    }
                } else {
                    addDebugInfo('No ID token in response, using profile data flow...');
                    const authResult = await authService.loginWithGoogleProfileMobile({
                        email: result.email,
                        displayName: result.displayName,
                        givenName: result.givenName,
                        familyName: result.familyName,
                        profilePictureUri: result.photoUrl
                    });

                    await nativeLogin(authResult.token, authResult.user);
                    addDebugInfo('Profile-based authentication completed successfully');
                    onSuccess(authResult);
                }
            } else {
                addDebugInfo(`Plugin returned failure: ${result.error || 'Unknown error'}`, 'error');
                onError(result.error || 'Google Sign-In failed');
            }

        } catch (error) {
            addDebugInfo(`Exception during sign-in: ${error.message}`, 'error');
            remoteLogger.error('Google Sign-In Exception', {
                error: error.message,
                stack: error.stack,
                userAgent: navigator.userAgent
            });
            onError(`Google Sign-In failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Google Sign-In Debug Test
            </Typography>

            <Button
                variant="contained"
                startIcon={<Google />}
                onClick={handleGoogleSignIn}
                disabled={disabled || loading}
                fullWidth
                sx={{ mb: 2 }}
            >
                {loading ? 'Testing Google Sign-In...' : 'Test Google Sign-In'}
            </Button>

            {debugInfo.length > 0 && (
                <Box sx={{
                    bgcolor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Debug Log:
                    </Typography>
                    {debugInfo.map((info, index) => (
                        <Box
                            key={index}
                            sx={{
                                color: info.includes('ERROR') ? 'red' :
                                       info.includes('WARN') ? 'orange' : 'black',
                                mb: 0.5
                            }}
                        >
                            {info}
                        </Box>
                    ))}
                </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This component provides detailed logging for debugging Google Sign-In issues.
                Check the server logs at /api/debug/sessions for remote logs.
            </Typography>
        </Box>
    );
};

export default GoogleSignInDebugButton;
