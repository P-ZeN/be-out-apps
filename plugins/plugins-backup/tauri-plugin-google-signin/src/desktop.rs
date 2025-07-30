use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<GoogleSignin<R>> {
    Ok(GoogleSignin(app.clone()))
}

/// Access to the google-signin APIs.
pub struct GoogleSignin<R: Runtime>(AppHandle<R>);

impl<R: Runtime> GoogleSignin<R> {
    pub fn request_signin(&self, _nonce: String) -> ! {
        panic!("Google Sign In is not implemented on desktop platforms")
    }

    pub fn logout(&self) -> ! {
        panic!("Google Sign In is not implemented on desktop platforms")
    }
}
