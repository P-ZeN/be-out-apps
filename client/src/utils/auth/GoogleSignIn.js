import { areTauriApisAvailable } from '../../utils/platformDetection';
import authService from '../../services/authService';

// Dynamic import for Tauri invoke function
const getTauriInvoke = async () => {
  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return invoke;
  } catch (error) {
    console.log('Tauri invoke not available:', error);
    return null;
  }
};

// Function to generate a random nonce
const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Sign in with Google - handles both web and Tauri implementations
 */
export const signInWithGoogle = async () => {
  try {
    console.log('Beginning detection of type of environment');

    // Check for Android interface first
    if (window.AndroidGoogleSignIn) {
      console.log('Environment detected: Android (AndroidGoogleSignIn interface available)');
      console.log('=== GOOGLE OAUTH START (Android Interface) ===');
      return signInWithGoogleAndroid();
    }

    // Use the more reliable detection method for Tauri
    const isTauriAvailable = areTauriApisAvailable();

    if (isTauriAvailable) {
      console.log('Environment detected: Tauri (Tauri APIs available)');
      console.log('=== GOOGLE OAUTH START (Tauri Plugin) ===');
      return signInWithGoogleTauri();
    } else {
      console.log('Environment detected: Web (no Tauri APIs, no Android interface)');
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
 * Android-specific Google Sign-in implementation using JavaScript interface
 */
async function signInWithGoogleAndroid() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Android interface detected, checking availability...');
      console.log('window.AndroidGoogleSignIn:', window.AndroidGoogleSignIn);
      console.log('typeof window.AndroidGoogleSignIn:', typeof window.AndroidGoogleSignIn);

      console.log('Testing Android interface...');
      const testResult = window.AndroidGoogleSignIn.testInterface();
      console.log('Android interface test result:', testResult);

      // Set up global callbacks for the result
      window.onGoogleSignInSuccess = function(result) {
        console.log('Android Google Sign-in success callback triggered:', result);

        if (result.success && result.user) {
          // Process the token with our backend
          authService.loginWithGoogleMobile(result.user.idToken)
            .then(authResult => {
              if (authResult.token) {
                localStorage.setItem('token', authResult.token);
                localStorage.setItem('user', JSON.stringify(authResult.user));

                resolve({
                  success: true,
                  user: authResult.user
                });
              } else {
                resolve({
                  success: false,
                  error: 'Failed to authenticate with server'
                });
              }
            })
            .catch(error => {
              console.error('Backend authentication error:', error);
              resolve({
                success: false,
                error: 'Server authentication failed'
              });
            });
        } else {
          resolve({
            success: false,
            error: 'Invalid sign-in result'
          });
        }
      };

      window.onGoogleSignInError = function(result) {
        console.error('Android Google Sign-in error callback triggered:', result);
        resolve({
          success: false,
          error: result.error || 'Android sign-in failed'
        });
      };

      // Start the sign-in process
      console.log('Starting Android Google Sign-in...');
      window.AndroidGoogleSignIn.signIn();
      console.log('Android Sign-in method called');

      // Set a timeout in case nothing happens
      setTimeout(() => {
        console.error('Android sign-in timeout - no response received');
        resolve({
          success: false,
          error: 'Sign-in timeout - no response from Android'
        });
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('Error in Android Google Sign-in:', error);
      reject({
        success: false,
        error: error.toString()
      });
    }
  });
}

/**
 * Tauri-specific Google Sign-in implementation
 */
async function signInWithGoogleTauri() {
  try {
    // Generate a random nonce for security
    const nonce = generateNonce();

    // Get the invoke function dynamically
    const invoke = await getTauriInvoke();
    if (!invoke) {
      throw new Error('Tauri invoke function not available');
    }

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
    // Check for Android interface first
    if (window.AndroidGoogleSignIn) {
      console.log('Using Android sign-out...');

      return new Promise((resolve) => {
        window.onGoogleSignOutComplete = function(result) {
          console.log('Android Google sign-out result:', result);

          // Always remove local tokens regardless of result
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          resolve(true);
        };

        try {
          window.AndroidGoogleSignIn.signOut();
        } catch (error) {
          console.error('Android sign-out error:', error);
          // Still remove local tokens
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          resolve(true);
        }
      });
    }

    const isTauriAvailable = areTauriApisAvailable();

    if (isTauriAvailable) {
      // Get the invoke function dynamically
      const invoke = await getTauriInvoke();
      if (invoke) {
        const result = await invoke('plugin:google-signin|googleSignOut');
        console.log('Google sign-out result:', result);
      }
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
