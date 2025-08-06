use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::GoogleAuthExt;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.google_auth().ping(payload)
}

#[command]
pub(crate) async fn google_sign_in<R: Runtime>(
    app: AppHandle<R>,
    payload: GoogleSignInRequest,
) -> Result<GoogleSignInResponse> {
    app.google_auth().google_sign_in(payload)
}

#[command]
pub(crate) async fn google_sign_out<R: Runtime>(
    app: AppHandle<R>,
) -> Result<GoogleSignOutResponse> {
    app.google_auth().google_sign_out()
}

#[command]
pub(crate) async fn is_signed_in<R: Runtime>(
    app: AppHandle<R>,
) -> Result<IsSignedInResponse> {
    app.google_auth().is_signed_in()
}
