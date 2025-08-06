use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime>(
  app: &AppHandle<R>,
  _api: PluginApi<R, ()>,
) -> crate::Result<GoogleAuth<R>> {
  Ok(GoogleAuth(app.clone()))
}

/// Access to the google-auth APIs.
pub struct GoogleAuth<R: Runtime>(AppHandle<R>);

impl<R: Runtime> GoogleAuth<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  pub fn google_sign_in(&self, _payload: GoogleSignInRequest) -> crate::Result<GoogleSignInResponse> {
    // Desktop implementation would use web-based OAuth flow
    // For now, return a placeholder response
    Ok(GoogleSignInResponse {
      success: true,
      id_token: Some("desktop_placeholder_token".to_string()),
      display_name: Some("Desktop User".to_string()),
      given_name: Some("Desktop".to_string()),
      family_name: Some("User".to_string()),
      profile_picture_uri: None,
      email: Some("desktop@example.com".to_string()),
      error: None,
    })
  }

  pub fn google_sign_out(&self) -> crate::Result<GoogleSignOutResponse> {
    // Desktop implementation would clear stored tokens
    Ok(GoogleSignOutResponse {
      success: true,
      error: None,
    })
  }

  pub fn is_signed_in(&self) -> crate::Result<IsSignedInResponse> {
    // Desktop implementation would check stored tokens
    Ok(IsSignedInResponse {
      is_signed_in: false,
      error: None,
    })
  }
}
