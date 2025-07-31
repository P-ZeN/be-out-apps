import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import { areTauriApisAvailable } from "../utils/platformDetection";
import NativeMobileAuthService from "../services/nativeMobileAuthService";

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
                // Redirect to onboarding if not complete
                if (!userData.onboarding_complete) {
                    navigate("/onboarding");
                }
            } else {
                // Check for existing token in localStorage
                const token = localStorage.getItem("token");
                if (token) {
                    try {
                        const userData = await userService.getProfile();
                        setUser(userData);
                    } catch (error) {
                        console.log("Token invalid, clearing localStorage");
                        localStorage.removeItem("token");
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

    const login = (userData) => {
        localStorage.setItem("token", userData.token);
        userService.getProfile().then((profileData) => {
            setUser(profileData);
            // Check if onboarding is complete and redirect accordingly
            if (!profileData.onboarding_complete) {
                navigate("/onboarding");
            }
        });
    };

    const loginWithToken = (token) => {
        localStorage.setItem("token", token);
        userService.getProfile().then((profileData) => {
            setUser(profileData);
            if (!profileData.onboarding_complete) {
                navigate("/onboarding");
            } else {
                navigate("/"); // Or to a default logged-in page
            }
        });
    };

    const nativeLogin = async (token = null, userData = null) => {
        try {
            setLoading(true);
            console.log("[AUTH_CONTEXT] Starting native login...");

            let result;

            if (token && userData) {
                // Direct login with provided token and user data (from Google Sign-in)
                console.log("[AUTH_CONTEXT] Using provided token and user data");
                localStorage.setItem("token", token);
                localStorage.setItem("userProfile", JSON.stringify(userData));
                setUser(userData);
                result = { user: userData, token };
            } else {
                // Fallback to native auth service
                console.log("[AUTH_CONTEXT] Using native auth service");
                result = await nativeAuthService.signIn();
                setUser(result.user);
            }

            console.log("[AUTH_CONTEXT] Native login successful");

            // Check if onboarding is complete
            if (!result.user.onboarding_complete) {
                navigate("/onboarding");
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

            // Clear local storage and state
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userProfile");
            setUser(null);

        } catch (error) {
            console.error("[AUTH_CONTEXT] Logout failed:", error);
            // Still clear local state even if there was an error
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
