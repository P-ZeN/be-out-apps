use tauri::command;
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
pub async fn google_sign_in(
    filter_by_authorized_accounts: Option<bool>,
    auto_select_enabled: Option<bool>, 
    nonce: String
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // For now, return a descriptive error that explains what's happening
        Ok(GoogleSignInResult {
            success: false,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: Some(format!(
                "Native Google Sign-In not yet fully implemented. Parameters received: filter_by_authorized_accounts={:?}, auto_select_enabled={:?}, nonce={}", 
                filter_by_authorized_accounts, 
                auto_select_enabled, 
                if nonce.len() > 10 { &nonce[..10] } else { &nonce }
            )),
        })
    }
    
    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-In is only available on Android".to_string())
    }
}

#[command]
pub async fn google_sign_out() -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // This would call the Android sign-out via JNI
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

#[command]
pub async fn open_url_android(url: String) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        // Use Android intent to open URL
        use std::process::Command;
        
        let output = Command::new("am")
            .args(&["start", "-a", "android.intent.action.VIEW", "-d", &url])
            .output();
            
        match output {
            Ok(result) if result.status.success() => Ok(()),
            Ok(result) => {
                let stderr = String::from_utf8_lossy(&result.stderr);
                Err(format!("Failed to open URL: {}", stderr))
            }
            Err(e) => Err(format!("Failed to execute command: {}", e))
        }
    }
    
    #[cfg(not(target_os = "android"))]
    {
        Err("This command is only available on Android".to_string())
    }
}
