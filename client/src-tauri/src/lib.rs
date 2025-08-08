// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize platform-specific loggers with error handling
    #[cfg(target_os = "android")]
    {
        match android_logger::init_once(
            android_logger::Config::default()
                .with_max_level(log::LevelFilter::Info)
                .with_tag("BeOutApp")
        ) {
            Ok(_) => log::info!("Android logger initialized successfully"),
            Err(e) => eprintln!("Failed to initialize Android logger: {}", e),
        }
    }

    #[cfg(target_os = "ios")]
    {
        match env_logger::try_init() {
            Ok(_) => log::info!("iOS logger initialized successfully"),
            Err(e) => eprintln!("Failed to initialize iOS logger: {}", e),
        }
    }

    log::info!("Starting Tauri application...");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init());
        // Google Auth plugin temporarily disabled
        // .plugin(tauri_plugin_google_auth::init());

    log::info!("Plugins initialized, starting app...");

    builder
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
