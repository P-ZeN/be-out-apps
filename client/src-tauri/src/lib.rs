// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use tauri_plugin_google_auth::GoogleAuthExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Test command to verify Google Auth plugin is working
#[tauri::command]
async fn test_google_auth_plugin(
    app: tauri::AppHandle,
) -> Result<String, String> {
    // Try to ping the Google Auth plugin using the extension trait
    match app.google_auth().ping(tauri_plugin_google_auth::PingRequest {
        value: Some("test".to_string())
    }) {
        Ok(response) => Ok(format!("Google Auth plugin is working! Response: {:?}", response.value)),
        Err(e) => Err(format!("Google Auth plugin error: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init());

    // Re-enable Google Auth plugin now that iOS startup crash is fixed
    // The plugin is properly configured for iOS 15 compatibility
    builder = builder.plugin(tauri_plugin_google_auth::init());

    builder
        .invoke_handler(tauri::generate_handler![greet, test_google_auth_plugin])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
