use std::sync::Mutex;
use tauri::{Manager, Window};

// State to store OAuth data
#[derive(Default)]
struct OAuthState {
    auth_code: Mutex<Option<String>>,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_oauth_url(
    app: tauri::AppHandle,
    state: tauri::State<'_, OAuthState>,
    url: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_shell::ShellExt;

    // Clear any previous auth code
    {
        let mut auth_code = state.auth_code.lock().unwrap();
        *auth_code = None;
    }

    // Open the OAuth URL in the default browser
    if let Err(e) = app.shell().open(&url, None) {
        return Err(format!("Failed to open browser: {}", e));
    }

    // Create a new window for OAuth callback handling
    let oauth_window = tauri::WebviewWindowBuilder::new(
        &app,
        "oauth-callback",
        tauri::WebviewUrl::App("oauth-callback.html".into())
    )
    .title("Complete Authentication")
    .inner_size(500.0, 600.0)
    .center()
    .resizable(false)
    .build()
    .map_err(|e| format!("Failed to create OAuth window: {}", e))?;

    // Wait for the auth code to be set (with timeout)
    let timeout = std::time::Duration::from_secs(300); // 5 minutes
    let start = std::time::Instant::now();

    loop {
        if start.elapsed() > timeout {
            let _ = oauth_window.close();
            return Err("OAuth timeout".to_string());
        }

        {
            let auth_code = state.auth_code.lock().unwrap();
            if let Some(code) = auth_code.as_ref() {
                let result = Some(code.clone());
                let _ = oauth_window.close();
                return Ok(result);
            }
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}

#[tauri::command]
async fn set_oauth_code(
    state: tauri::State<'_, OAuthState>,
    code: String,
) -> Result<(), String> {
    let mut auth_code = state.auth_code.lock().unwrap();
    *auth_code = Some(code);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(OAuthState::default())
        .invoke_handler(tauri::generate_handler![greet, open_oauth_url, set_oauth_code])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
