use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime>(
  app: &AppHandle<R>,
  _api: PluginApi<R>,
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
}
