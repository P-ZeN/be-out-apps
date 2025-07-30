use tauri::{command, AppHandle, Runtime};
use crate::models::GoogleSignInResult;

#[command]
pub async fn google_sign_in<R: Runtime>(
    _app: AppHandle<R>,
    nonce: Option<String>,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // The actual sign-in will be handled by the Tauri plugin on the Android side
        // For now, return a pending result since the Android plugin handles the UI flow
        Ok(GoogleSignInResult {
            success: false,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: Some("Sign-in initiated".to_string()),
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        // For non-Android platforms, return a mock result for testing
        Ok(GoogleSignInResult {
            success: false,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: Some("Google Sign-In is only available on Android".to_string()),
        })
    }
}

#[command]
pub async fn google_sign_out<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // The actual sign-out will be handled by the Tauri plugin on the Android side
        Ok(GoogleSignInResult {
            success: true,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: None,
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        // For non-Android platforms
        Ok(GoogleSignInResult {
            success: true,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: None,
        })
    }
}
