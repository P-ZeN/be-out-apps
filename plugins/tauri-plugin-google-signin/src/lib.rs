use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod models;
mod commands;

pub use models::GoogleSignInResult;

/// Initialize the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("google-signin")
        .invoke_handler(tauri::generate_handler![
            commands::google_sign_in,
            commands::google_sign_out
        ])
        .setup(|_app, _api| {
            // Temporarily disable Android plugin registration to test
            // #[cfg(target_os = "android")]
            // {
            //     let _handle = api.register_android_plugin("com.plugin.googlesignin", "TauriGoogleSigninPlugin")?;
            // }
            Ok(())
        })
        .build()
}
