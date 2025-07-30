// Example client-side code to implement Google Sign-in with Tauri
import { invoke } from '@tauri-apps/api/tauri';

async function signInWithGoogle() {
  try {
    console.log('=== GOOGLE OAUTH START (Tauri Plugin) ===');

    // Generate a random nonce for security
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Call the plugin's sign-in method
    const result = await invoke('plugin:google-signin|google_sign_in', {
      filterByAuthorizedAccounts: false,
      autoSelectEnabled: false,
      nonce: nonce
    });

    console.log('Google sign-in result:', result);

    if (result.success) {
      // Authentication successful - process the token
      const idToken = result.id_token;
      const displayName = result.display_name;

      // Use this token for backend authentication or user display
      console.log(`Successfully signed in as ${displayName}`);

      // Now you can send the ID token to your backend for verification
      await verifyTokenWithBackend(idToken);

      return {
        success: true,
        user: {
          name: displayName,
          givenName: result.given_name,
          familyName: result.family_name,
          profilePicture: result.profile_picture_uri
        }
      };
    } else {
      // Authentication failed
      console.error('Google sign-in failed:', result.error);
      return {
        success: false,
        error: result.error
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

async function signOutFromGoogle() {
  try {
    const result = await invoke('plugin:google-signin|google_sign_out');
    console.log('Google sign-out result:', result);
    return result.success;
  } catch (error) {
    console.error('Error during Google sign-out:', error);
    return false;
  }
}

async function verifyTokenWithBackend(idToken) {
  // Send the ID token to your backend for verification
  // This is just an example - replace with your actual backend endpoint
  try {
    const response = await fetch('https://server.be-out-app.dedibox2.philippezenone.net/api/oauth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    const data = await response.json();
    console.log('Backend verification result:', data);
    return data;
  } catch (error) {
    console.error('Error verifying token with backend:', error);
    throw error;
  }
}

export { signInWithGoogle, signOutFromGoogle };
