use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_google_signin);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<GoogleSignin<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("tauri-plugin-google-signin", "com.plugin.googlesignin.GoogleSigninPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_google_signin)?;
  Ok(GoogleSignin(handle))
}

/// Access to the google-signin APIs.
pub struct GoogleSignin<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> GoogleSignin<R> {
  pub fn request_signin(&self, _nonce: String) -> crate::Result<RequestSignInResponse> {
    // Call the plugin without args for now
    self
      .0
      .run_mobile_plugin("request_signin", ())
      .map_err(Into::into)
  }

    pub fn logout(&self) -> crate::Result<()> {
        self
        .0
        .run_mobile_plugin("signout", ())
        .map_err(Into::into)
    }
}
