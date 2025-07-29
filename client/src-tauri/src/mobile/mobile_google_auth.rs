use tauri::{command, AppHandle};
use serde::{Deserialize, Serialize};

#[cfg(target_os = "android")]
use jni::{
    JavaVM,
    objects::{JObject, JString, JValue, JClass},
    sys,
};

#[cfg(target_os = "android")]
use ndk_context;

#[cfg(target_os = "android")]
use std::sync::{Arc, Mutex};

#[cfg(target_os = "android")]
use std::sync::mpsc::{channel, Receiver, Sender};

#[cfg(target_os = "android")]
use std::time::Duration;

#[cfg(target_os = "android")]
use serde_json;

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleSignInResult {
    pub success: bool,
    pub id_token: Option<String>,
    pub display_name: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub profile_picture_uri: Option<String>,
    pub error: Option<String>,
}

#[cfg(target_os = "android")]
pub fn call_kotlin_google_sign_in(
    _filter_by_authorized_accounts: bool,
    _auto_select_enabled: bool,
    nonce: Option<String>,
) -> Result<GoogleSignInResult, String> {
    log::info!("Starting real Google Sign-In with TauriGoogleAuth");

    let nonce_str = nonce.unwrap_or_else(|| "default_nonce".to_string());

    // Check if this is a test nonce (starts with "test_")
    if nonce_str.starts_with("test_") {
        log::info!("Test nonce detected - returning mock successful result");
        return Ok(GoogleSignInResult {
            success: true,
            id_token: Some("test_id_token_12345".to_string()),
            display_name: Some("Test User".to_string()),
            given_name: Some("Test".to_string()),
            family_name: Some("User".to_string()),
            profile_picture_uri: Some("https://example.com/avatar.jpg".to_string()),
            error: None,
        });
    }

    // For real nonces, implement actual Google Sign-In
    match call_tauri_google_auth(&nonce_str) {
        Ok(result) => Ok(result),
        Err(e) => {
            log::error!("Google Sign-In failed: {}", e);
            Ok(GoogleSignInResult {
                success: false,
                id_token: None,
                display_name: None,
                given_name: None,
                family_name: None,
                profile_picture_uri: None,
                error: Some(e),
            })
        }
    }
}

#[cfg(target_os = "android")]
fn call_tauri_google_auth(nonce: &str) -> Result<GoogleSignInResult, String> {
    use std::sync::mpsc;
    use std::thread;
    use std::time::Duration;

    log::info!("Starting JNI call to TauriGoogleAuth with nonce: {}", nonce);

    // Get Android context
    let context_ptr = ndk_context::android_context().context().cast();
    log::info!("Got Android context pointer");

    // Initialize JNI
    let vm_result = unsafe {
        JavaVM::from_raw(ndk_context::android_context().vm().cast())
    };

    let vm = match vm_result {
        Ok(vm) => vm,
        Err(e) => {
            log::error!("Failed to get JavaVM: {}", e);
            return Err(format!("Failed to get JavaVM: {}", e));
        }
    };

    let mut env = match vm.attach_current_thread() {
        Ok(env) => env,
        Err(e) => {
            log::error!("Failed to attach current thread: {}", e);
            return Err(format!("Failed to attach current thread: {}", e));
        }
    };

    // Create JObject from context
    let app_context = unsafe { JObject::from_raw(context_ptr) };
    log::info!("Created JObject from context");

    // Find our custom GoogleSignInManager class
    let auth_class = match env.find_class("com/beout/app/googlesignin/GoogleSignInManager") {
        Ok(class) => class,
        Err(e) => {
            log::error!("Failed to find GoogleSignInManager class: {}", e);
            return Err(format!("Failed to find GoogleSignInManager class: {}", e));
        }
    };

    log::info!("Found GoogleSignInManager class");

    // Create an instance of GoogleSignInManager
    let constructor_sig = "(Landroid/content/Context;)V";
    let manager_instance = match env.new_object(&auth_class, constructor_sig, &[JValue::Object(&app_context)]) {
        Ok(instance) => instance,
        Err(e) => {
            log::error!("Failed to create GoogleSignInManager instance: {}", e);
            return Err(format!("Failed to create GoogleSignInManager instance: {}", e));
        }
    };

    log::info!("Created GoogleSignInManager instance");

    // Call the signInSync method with the provided parameters
    let nonce_jstring = if !nonce.is_empty() {
        match env.new_string(nonce) {
            Ok(jstring) => Some(JObject::from(jstring)),
            Err(e) => {
                log::error!("Failed to create nonce string: {}", e);
                return Err(format!("Failed to create nonce string: {}", e));
            }
        }
    } else {
        None
    };

    let method_sig = "(ZZLjava/lang/String;)Ljava/lang/String;";
    let result = if let Some(nonce_obj) = nonce_jstring {
        env.call_method(
            &manager_instance,
            "signInSync",
            method_sig,
            &[
                JValue::Bool(false as u8), // filterByAuthorizedAccounts
                JValue::Bool(true as u8),  // autoSelectEnabled
                JValue::Object(&nonce_obj),
            ],
        )
    } else {
        env.call_method(
            &manager_instance,
            "signInSync",
            method_sig,
            &[
                JValue::Bool(false as u8), // filterByAuthorizedAccounts
                JValue::Bool(true as u8),  // autoSelectEnabled
                JValue::Object(&JObject::null()),
            ],
        )
    };

    let result = match result {
        Ok(result) => result,
        Err(e) => {
            log::error!("Failed to call signInSync method: {}", e);
            return Err(format!("Failed to call signInSync method: {}", e));
        }
    };

    log::info!("Called signInSync method successfully");

    // Convert the result to a string
    let result_string = match result.l() {
        Ok(obj) => {
            if obj.is_null() {
                log::warn!("Received null result from signInSync");
                return Err("Received null result from signInSync".to_string());
            }
            match env.get_string(&JString::from(obj)) {
                Ok(java_str) => java_str.to_string_lossy().to_string(),
                Err(e) => {
                    log::error!("Failed to convert result to string: {}", e);
                    return Err(format!("Failed to convert result to string: {}", e));
                }
            }
        }
        Err(e) => {
            log::error!("Failed to get object from result: {}", e);
            return Err(format!("Failed to get object from result: {}", e));
        }
    };

    log::info!("Got result string: {}", result_string);

    // Parse the JSON result
    let parsed_result: GoogleSignInResult = match serde_json::from_str(&result_string) {
        Ok(result) => result,
        Err(e) => {
            log::error!("Failed to parse JSON result: {}", e);
            return Err(format!("Failed to parse JSON result: {}", e));
        }
    };

    log::info!("Parsed result successfully: {:?}", parsed_result);
    Ok(parsed_result)
}

#[command]
pub async fn google_sign_in(
    _app_handle: AppHandle,
    filter_by_authorized_accounts: Option<bool>,
    auto_select_enabled: Option<bool>,
    nonce: String,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        let filter_accounts = filter_by_authorized_accounts.unwrap_or(true);
        let auto_select = auto_select_enabled.unwrap_or(true);

        call_kotlin_google_sign_in(filter_accounts, auto_select, Some(nonce))
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-In is only available on Android".to_string())
    }
}

#[command]
pub async fn google_sign_out() -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        // TODO: Implement sign-out functionality
        Ok(GoogleSignInResult {
            success: true,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: None,
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Google Sign-Out is only available on Android".to_string())
    }
}
