// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[cfg(debug_assertions)]
#[cfg(target_os = "android")]
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[cfg(debug_assertions)]
#[cfg(target_os = "android")]
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn google_sign_in_android() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "android")]
    {
        // For Android, we'll use Tauri's mobile event system to communicate with MainActivity
        // This approach uses Tauri's event emission to trigger Android code

        // Return a success response and use Tauri events to trigger MainActivity
        Ok(serde_json::json!({
            "command": "google_sign_in",
            "platform": "android",
            "message": "Tauri command executed - using event system to trigger MainActivity",
            "action": "trigger_google_signin"
        }))
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-in is only available on Android".to_string())
    }
}

#[tauri::command]
async fn setup_android_interface() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "android")]
    {
        // This command will be used to trigger MainActivity interface setup
        // We'll emit an event that MainActivity can listen for

        Ok(serde_json::json!({
            "success": true,
            "platform": "android",
            "message": "Setup command executed",
            "action": "setup_javascript_interface"
        }))
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Setup is only available on Android".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_google_auth::init())
        // .plugin(tauri_plugin_google_signin::init()) // Disabled - using official plugin architecture
        .invoke_handler(tauri::generate_handler![greet, google_sign_in_android, setup_android_interface])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
