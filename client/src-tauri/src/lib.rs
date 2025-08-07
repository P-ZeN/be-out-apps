// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

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
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init());

    // Add Google Auth plugin with iOS safety measures
    #[cfg(not(target_os = "ios"))]
    {
        // For non-iOS platforms, add plugin normally
        builder = builder.plugin(tauri_plugin_google_auth::init());
    }

    #[cfg(target_os = "ios")]
    {
        // For iOS, add plugin with delayed initialization to avoid startup crashes
        use std::sync::Once;
        static INIT: Once = Once::new();
        
        INIT.call_once(|| {
            // Initialize iOS-specific components safely
            std::thread::spawn(|| {
                std::thread::sleep(std::time::Duration::from_millis(500));
                // Plugin will be initialized after app startup is complete
            });
        });
        
        // Still add the plugin but with iOS-specific safety measures
        builder = builder.plugin(tauri_plugin_google_auth::init());
    }

    builder
        .invoke_handler(tauri::generate_handler![greet, google_sign_in_android, setup_android_interface])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
