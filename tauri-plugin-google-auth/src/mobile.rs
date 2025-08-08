use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_google_auth);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime>(
  _app: &AppHandle<R>,
  api: PluginApi<R, ()>,
) -> crate::Result<GoogleAuth<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("com.plugin.googleauth", "GoogleAuthPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_google_auth)?;
  Ok(GoogleAuth(handle))
}

/// Access to the google-auth APIs.
pub struct GoogleAuth<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> GoogleAuth<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    self
      .0
      .run_mobile_plugin("ping", payload)
      .map_err(Into::into)
  }

  pub fn google_sign_in(&self, payload: GoogleSignInRequest) -> crate::Result<GoogleSignInResponse> {
    self
      .0
      .run_mobile_plugin("google_sign_in", payload)
      .map_err(Into::into)
  }

  pub fn google_sign_out(&self) -> crate::Result<GoogleSignOutResponse> {
    self
      .0
      .run_mobile_plugin("google_sign_out", ())
      .map_err(Into::into)
  }

  pub fn is_signed_in(&self) -> crate::Result<IsSignedInResponse> {
    self
      .0
      .run_mobile_plugin("is_signed_in", ())
      .map_err(Into::into)
  }
}
