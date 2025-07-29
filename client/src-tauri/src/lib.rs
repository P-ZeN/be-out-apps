// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[cfg(debug_assertions)]
#[cfg(target_os = "android")]
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_social::init())
        .invoke_handler(tauri::generate_handler![greet]);

    #[cfg(debug_assertions)]
    #[cfg(target_os = "android")]
    {
        // Enable WebView debugging on Android debug builds
        let builder = builder.setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();
            main_window.open_devtools();
            Ok(())
        });

        builder
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }

    #[cfg(not(all(debug_assertions, target_os = "android")))]
    {
        builder
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
