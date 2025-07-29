use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager, AppHandle,
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

#[tauri::command]
async fn plugin_google_sign_in<R: Runtime>(
    _app: AppHandle<R>,
    filter_by_authorized_accounts: Option<bool>,
    auto_select_enabled: Option<bool>,
    nonce: String
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // This is where we'd implement the actual native call
        // For now, return a clear status message
        Ok(GoogleSignInResult {
            success: false,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: Some(format!(
                "Google Auth Plugin ready. Native implementation needs Tauri Android plugin development. Filter: {:?}, AutoSelect: {:?}",
                filter_by_authorized_accounts.unwrap_or(true),
                auto_select_enabled.unwrap_or(true)
            )),
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-In is only available on Android".to_string())
    }
}

/// Initialize the Google Auth plugin
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("google-auth")
        .invoke_handler(tauri::generate_handler![plugin_google_sign_in])
        .build()
}
