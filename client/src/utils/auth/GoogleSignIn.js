import { invoke } from '@tauri-apps/api/tauri';
import { areTauriApisAvailable } from '../../utils/platformDetection';
import authService from '../../services/authService';

// Function to generate a random nonce
const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Sign in with Google - handles both web and Tauri implementations
 */
export const signInWithGoogle = async () => {
  try {
    // Use the more reliable detection method
    const isTauriAvailable = areTauriApisAvailable();

    if (isTauriAvailable) {
      console.log('=== GOOGLE OAUTH START (Tauri Plugin) ===');
      return signInWithGoogleTauri();
    } else {
      console.log('=== GOOGLE OAUTH START (Web) ===');
      // For non-Tauri environments, redirect to the server OAuth endpoint
      const redirectUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/oauth/google`;
      window.location.href = redirectUrl;
      return { success: true, pending: true };
    }
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
};

/**
 * Tauri-specific Google Sign-in implementation
 */
async function signInWithGoogleTauri() {
  try {
    // Generate a random nonce for security
    const nonce = generateNonce();

    // Call the mobile plugin command directly
    const result = await invoke('plugin:google-signin|googleSignIn', {});

    console.log('Google sign-in plugin result:', result);

    if (result.success && result.user) {
      // Authentication successful - process the token
      const idToken = result.user.idToken;

      // Send the ID token to the backend for verification and to get JWT
      const authResult = await authService.loginWithGoogleMobile(idToken);

      if (authResult.token) {
        // Store the JWT token from our backend
        localStorage.setItem('token', authResult.token);
        localStorage.setItem('user', JSON.stringify(authResult.user));

        return {
          success: true,
          user: authResult.user
        };
      } else {
        return {
          success: false,
          error: 'Failed to authenticate with server'
        };
      }
    } else {
      // Authentication failed
      console.error('Google sign-in failed:', result.error);
      return {
        success: false,
        error: result.error || 'Google authentication failed'
      };
    }
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Sign out from Google account
 */
export const signOutFromGoogle = async () => {
  try {
    const isTauriAvailable = areTauriApisAvailable();

    if (isTauriAvailable) {
      const result = await invoke('plugin:google-signin|googleSignOut');
      console.log('Google sign-out result:', result);
    }

    // Always remove local tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return true;
  } catch (error) {
    console.error('Error during Google sign-out:', error);
    return false;
  }
};
