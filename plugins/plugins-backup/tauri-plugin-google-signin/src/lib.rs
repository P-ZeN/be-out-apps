use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::GoogleSignin;
#[cfg(mobile)]
use mobile::GoogleSignin;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the google-signin APIs.
pub trait GoogleSigninExt<R: Runtime> {
  fn google_signin(&self) -> &GoogleSignin<R>;
}

impl<R: Runtime, T: Manager<R>> crate::GoogleSigninExt<R> for T {
  fn google_signin(&self) -> &GoogleSignin<R> {
    self.state::<GoogleSignin<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("google-signin")
    .invoke_handler(tauri::generate_handler![commands::request_signin, commands::logout])
    .setup(|app, api| {
      #[cfg(mobile)]
      let google_signin = mobile::init(app, api)?;
      #[cfg(desktop)]
      let google_signin = desktop::init(app, api)?;
      app.manage(google_signin);
      Ok(())
    })
    .build()
}
