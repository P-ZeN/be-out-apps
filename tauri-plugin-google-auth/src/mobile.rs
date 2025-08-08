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
  // Wrap plugin registration in error handling to prevent startup crashes
  let handle = match () {
    #[cfg(target_os = "android")]
    () => {
      match api.register_android_plugin("com.plugin.googleauth", "GoogleAuthPlugin") {
        Ok(h) => {
          println!("Android Google Auth plugin registered successfully");
          h
        },
        Err(e) => {
          eprintln!("Failed to register Android Google Auth plugin: {}", e);
          return Err(e.into());
        }
      }
    },
    #[cfg(target_os = "ios")]
    () => {
      match api.register_ios_plugin(init_plugin_google_auth) {
        Ok(h) => {
          println!("iOS Google Auth plugin registered successfully");
          h
        },
        Err(e) => {
          eprintln!("Failed to register iOS Google Auth plugin: {}", e);
          return Err(e.into());
        }
      }
    },
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    () => {
      return Err("Google Auth plugin only supports mobile platforms".into());
    }
  };

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
      .run_mobile_plugin("signIn", payload)
      .map_err(Into::into)
  }

  pub fn google_sign_out(&self) -> crate::Result<GoogleSignOutResponse> {
    self
      .0
      .run_mobile_plugin("signOut", ())
      .map_err(Into::into)
  }

  pub fn is_signed_in(&self) -> crate::Result<IsSignedInResponse> {
    self
      .0
      .run_mobile_plugin("isSignedIn", ())
      .map_err(Into::into)
  }
}
