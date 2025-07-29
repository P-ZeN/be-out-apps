use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager, AppHandle, command,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleSignInResult {
    pub success: bool,
    pub id_token: Option<String>,
    pub display_name: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub profile_picture_uri: Option<String>,
    pub error: Option<String>,
}

#[command]
async fn google_sign_in<R: Runtime>(
    app: AppHandle<R>,
    filter_by_authorized_accounts: Option<bool>,
    auto_select_enabled: Option<bool>,
    nonce: String,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // Use Tauri's mobile plugin approach
        use tauri::plugin::PluginApi;

        // Try to call the native Android method through Tauri's plugin system
        match call_native_google_sign_in(&app, filter_by_authorized_accounts, auto_select_enabled, nonce).await {
            Ok(result) => Ok(result),
            Err(e) => Err(format!("Google Sign-In failed: {}", e))
        }
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-In is only available on Android".to_string())
    }
}

#[cfg(target_os = "android")]
async fn call_native_google_sign_in<R: Runtime>(
    _app: &AppHandle<R>,
    _filter_by_authorized_accounts: Option<bool>,
    _auto_select_enabled: Option<bool>,
    _nonce: String,
) -> Result<GoogleSignInResult, String> {
    // This would integrate with Android through Tauri's plugin system
    // For now, return a clear error about the implementation approach needed
    Ok(GoogleSignInResult {
        success: false,
        id_token: None,
        display_name: None,
        given_name: None,
        family_name: None,
        profile_picture_uri: None,
        error: Some("Plugin-based Android integration needed. Requires implementing Tauri Android plugin with Kotlin bridge.".to_string()),
    })
}

#[command]
async fn google_sign_out<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // TODO: Implement sign-out functionality
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
        Err("Google Sign-Out is only available on Android".to_string())
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("google-auth")
        .invoke_handler(tauri::generate_handler![google_sign_in, google_sign_out])
        .build()
}
