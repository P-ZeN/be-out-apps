import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import { areTauriApisAvailable } from "../utils/platformDetection";
import NativeMobileAuthService from "../services/nativeMobileAuthService";
import secureStorage from "../services/secureStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const nativeAuthService = new NativeMobileAuthService();

    useEffect(() => {
        initializeAuth();
    }, [navigate]);

    const initializeAuth = async () => {
        try {
            // Check for token in URL parameters (from OAuth redirect for web version)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get("token");

            if (tokenFromUrl) {
                // Store the token and clean up URL
                localStorage.setItem("token", tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);

                // Get user profile with the new token
                const userData = await userService.getProfile();
                setUser(userData);
                
                // Store credentials securely if user wants to be remembered
                if (secureStorage.getRememberMe()) {
                    await secureStorage.storeCredentials({
                        token: tokenFromUrl,
                        user: userData
                    });
                }
                
                // Redirect to onboarding if not complete
                if (!userData.onboarding_complete) {
                    navigate("/onboarding");
                }
            } else {
                // First, try to get stored credentials (mobile persistent auth)
                const storedCredentials = await secureStorage.getStoredCredentials();
                if (storedCredentials && storedCredentials.token) {
                    console.log("[AUTH_CONTEXT] Found stored credentials, attempting auto-login");
                    try {
                        // Set token and verify it's still valid
                        localStorage.setItem("token", storedCredentials.token);
                        const userData = await userService.getProfile();
                        setUser(userData);
                        console.log("[AUTH_CONTEXT] Auto-login successful");
                        return; // Success, no need to check other methods
                    } catch (error) {
                        console.log("[AUTH_CONTEXT] Stored credentials invalid, clearing...");
                        await secureStorage.clearCredentials();
                        localStorage.removeItem("token");
                    }
                }

                // Check for existing token in localStorage
                const token = localStorage.getItem("token");
                if (token) {
                    try {
                        const userData = await userService.getProfile();
                        setUser(userData);
                    } catch (error) {
                        console.log("Token invalid, clearing localStorage");
                        localStorage.removeItem("token");
                        await secureStorage.clearCredentials();
                        setUser(null);
                    }
                } else if (areTauriApisAvailable()) {
                    // For mobile, check if user is signed in natively
                    try {
                        const isSignedIn = await nativeAuthService.isSignedIn();
                        if (isSignedIn) {
                            const currentUser = nativeAuthService.getCurrentUser();
                            if (currentUser) {
                                setUser(currentUser);
                            }
                        }
                    } catch (error) {
                        console.log("Native auth check failed:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Auth initialization failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData, rememberMe = false) => {
        localStorage.setItem("token", userData.token);
        
        // Store remember preference
        await secureStorage.setRememberMe(rememberMe);
        
        try {
            const profileData = await userService.getProfile();
            setUser(profileData);
            
            // Store credentials securely if user wants to be remembered
            if (rememberMe) {
                await secureStorage.storeCredentials({
                    token: userData.token,
                    user: profileData
                });
            }
            
            // Check if onboarding is complete and redirect accordingly
            if (!profileData.onboarding_complete) {
                navigate("/onboarding");
            } else {
                // Redirect to dashboard after successful login
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Error during login profile fetch:", error);
        }
    };

    const loginWithToken = (token) => {
        localStorage.setItem("token", token);
        userService.getProfile().then((profileData) => {
            setUser(profileData);
            if (!profileData.onboarding_complete) {
                navigate("/onboarding");
            } else {
                // Redirect to dashboard after successful login
                navigate("/dashboard");
            }
        });
    };

    const nativeLogin = async (token = null, userData = null, rememberMe = true) => {
        try {
            setLoading(true);
            console.log("[AUTH_CONTEXT] Starting native login...");
            console.log("[AUTH_CONTEXT] Token:", !!token, "UserData:", !!userData);

            let result;

            if (token && userData) {
                // Direct login with provided token and user data (from Google Sign-in)
                console.log("[AUTH_CONTEXT] Using provided token and user data");
                localStorage.setItem("token", token);
                localStorage.setItem("userProfile", JSON.stringify(userData));

                // Get full user profile to check onboarding status
                try {
                    const fullUserData = await userService.getProfile();
                    console.log("[AUTH_CONTEXT] Full user profile retrieved:", fullUserData);
                    setUser(fullUserData);
                    result = { user: fullUserData, token };
                    
                    // Store credentials securely for mobile (default behavior for native login)
                    if (rememberMe) {
                        await secureStorage.storeCredentials({
                            token,
                            user: fullUserData
                        });
                    }
                } catch (profileError) {
                    console.warn("[AUTH_CONTEXT] Could not get full profile, using provided data:", profileError);
                    setUser(userData);
                    result = { user: userData, token };
                    
                    // Store credentials securely for mobile
                    if (rememberMe) {
                        await secureStorage.storeCredentials({
                            token,
                            user: userData
                        });
                    }
                }
            } else {
                // Fallback to native auth service
                console.log("[AUTH_CONTEXT] Using native auth service");
                result = await nativeAuthService.signIn();
                setUser(result.user);
                
                // Store credentials securely for mobile
                if (rememberMe && result.token) {
                    await secureStorage.storeCredentials({
                        token: result.token,
                        user: result.user
                    });
                }
            }

            console.log("[AUTH_CONTEXT] Native login successful");
            console.log("[AUTH_CONTEXT] User onboarding complete:", result.user.onboarding_complete);

            // Check if onboarding is complete - navigate to onboarding if not
            if (result.user.onboarding_complete === false || result.user.onboarding_complete === undefined) {
                console.log("[AUTH_CONTEXT] Redirecting to onboarding");
                navigate("/onboarding");
            } else {
                console.log("[AUTH_CONTEXT] User already onboarded, redirecting to dashboard");
                // Redirect to dashboard after successful native login
                navigate("/dashboard");
            }

            return result;
        } catch (error) {
            console.error("[AUTH_CONTEXT] Native login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // If we're in a Tauri environment, also sign out natively
            if (areTauriApisAvailable()) {
                try {
                    await nativeAuthService.signOut();
                    console.log("[AUTH_CONTEXT] Native sign-out successful");
                } catch (error) {
                    console.error("[AUTH_CONTEXT] Native sign-out failed:", error);
                    // Continue with local logout even if native sign-out fails
                }
            }

            // Clear secure storage
            await secureStorage.clearCredentials();

            // Clear local storage and state
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userProfile");
            setUser(null);

        } catch (error) {
            console.error("[AUTH_CONTEXT] Logout failed:", error);
            // Still clear local state even if there was an error
            await secureStorage.clearCredentials();
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userProfile");
            setUser(null);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        // Also update in localStorage for native auth
        if (userData && typeof localStorage !== 'undefined') {
            localStorage.setItem('userProfile', JSON.stringify(userData));
        }
    };

    const value = {
        user,
        login,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user,
        // Add native login method for mobile
        nativeLogin: areTauriApisAvailable() ? nativeLogin : null,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
