use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleSignInResponse {
    pub success: bool,
    pub id_token: Option<String>,
    pub error: Option<String>,
}

#[command]
pub async fn google_sign_in(
    filter_by_authorized_accounts: bool,
    auto_select_enabled: bool,
    nonce: String,
) -> Result<GoogleSignInResponse, String> {
    // This is a placeholder - on mobile, Tauri's plugin system should route this
    // to the native Android/iOS implementation automatically
    Ok(GoogleSignInResponse {
        success: false,
        id_token: None,
        error: Some("Plugin command executed - check native implementation".to_string()),
    })
}
