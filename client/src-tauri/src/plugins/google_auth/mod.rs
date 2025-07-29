use tauri::{plugin::TauriPlugin, Runtime};

pub use commands::*;

mod commands;

/// Initialize the Google Auth plugin
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    tauri::plugin::Builder::new("google_auth")
        .invoke_handler(tauri::generate_handler![google_sign_in])
        .setup(|_app, _api| {
            #[cfg(mobile)]
            _api.register_android_plugin("app.tauri.googleauth", "GoogleAuthPlugin")?;

            Ok(())
        })
        .build()
}
