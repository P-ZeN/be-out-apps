use tauri::command;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex, OnceLock};

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
use jni::{
    JNIEnv, JavaVM,
    objects::{JObject, JString, JValue},
    sys::{JNI_TRUE, JNI_FALSE},
};

#[cfg(target_os = "android")]
static GOOGLE_AUTH_MANAGER: OnceLock<Arc<Mutex<Option<JavaVM>>>> = OnceLock::new();

#[cfg(target_os = "android")]
fn get_java_vm() -> Result<Arc<Mutex<Option<JavaVM>>>, String> {
    // Get or initialize the JavaVM
    let manager_mutex = GOOGLE_AUTH_MANAGER.get_or_init(|| {
        Arc::new(Mutex::new(None))
    });

    let mut manager_guard = manager_mutex.lock()
        .map_err(|e| format!("Failed to lock GoogleAuthManager: {}", e))?;

    if manager_guard.is_none() {
        // Try to get the JavaVM from ndk-context
        match ndk_context::android_context().vm().as_ptr() {
            vm_ptr if !vm_ptr.is_null() => {
                // Create JavaVM from the raw pointer
                let vm = unsafe { JavaVM::from_raw(vm_ptr) }
                    .map_err(|e| format!("Failed to create JavaVM from raw pointer: {}", e))?;
                *manager_guard = Some(vm);
            }
            _ => return Err("Android context not available".to_string()),
        }
    }

    drop(manager_guard);
    Ok(manager_mutex.clone())
}

#[cfg(target_os = "android")]
fn call_kotlin_google_sign_in(
    filter_by_authorized_accounts: bool,
    auto_select_enabled: bool,
    nonce: String,
) -> Result<GoogleSignInResult, String> {
    let vm_mutex = get_java_vm()?;
    let vm_guard = vm_mutex.lock()
        .map_err(|e| format!("Failed to lock JavaVM: {}", e))?;

    let vm = vm_guard.as_ref()
        .ok_or("JavaVM not initialized")?;

    let mut env = vm.attach_current_thread()
        .map_err(|e| format!("Failed to attach to JVM thread: {}", e))?;

    // Get the GoogleSignInManager class
    let manager_class = env.find_class("com/beout/app/googlesignin/GoogleSignInManager")
        .map_err(|e| format!("Failed to find GoogleSignInManager class: {}", e))?;

    // Create a new instance
    let manager_instance = env.new_object(&manager_class, "()V", &[])
        .map_err(|e| format!("Failed to create GoogleSignInManager instance: {}", e))?;

    // Get the current activity from Android context
    let activity_ptr = ndk_context::android_context().context().cast();
    let activity_obj = unsafe { JObject::from_raw(activity_ptr) };

    // Initialize the manager
    let init_method_sig = "(Landroid/content/Context;Landroid/app/Activity;)V";
    env.call_method(&manager_instance, "initialize", init_method_sig, &[
        JValue::Object(&activity_obj),
        JValue::Object(&activity_obj)
    ]).map_err(|e| format!("Failed to initialize GoogleSignInManager: {}", e))?;

    // Call signInSync method
    let nonce_jstring = env.new_string(&nonce)
        .map_err(|e| format!("Failed to create nonce string: {}", e))?;

    let sync_method_sig = "(ZZLjava/lang/String;)Ljava/lang/String;";
    let result = env.call_method(
        &manager_instance,
        "signInSync",
        sync_method_sig,
        &[
            JValue::Bool(if filter_by_authorized_accounts { 1 } else { 0 }),
            JValue::Bool(if auto_select_enabled { 1 } else { 0 }),
            JValue::Object(&nonce_jstring)
        ]
    ).map_err(|e| format!("Failed to call signInSync: {}", e))?;

    // Extract the result string
    let result_string = match result.l() {
        Ok(obj) if !obj.is_null() => {
            let jstring = JString::from(obj);
            let java_str = env.get_string(&jstring)
                .map_err(|e| format!("Failed to get string from Java: {}", e))?;
            java_str.to_string_lossy().to_string()
        }
        _ => return Err("Failed to get result from signInSync".to_string()),
    };

    // Parse the JSON result
    parse_google_sign_in_result(&result_string)
}

#[cfg(target_os = "android")]
fn parse_google_sign_in_result(json_str: &str) -> Result<GoogleSignInResult, String> {
    use serde_json::Value;

    let json: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse JSON result: {}", e))?;

    let success = json.get("success").and_then(|v| v.as_bool()).unwrap_or(false);

    if !success {
        let error = json.get("error").and_then(|v| v.as_str()).unwrap_or("Unknown error");
        return Ok(GoogleSignInResult {
            success: false,
            id_token: None,
            display_name: None,
            given_name: None,
            family_name: None,
            profile_picture_uri: None,
            error: Some(error.to_string()),
        });
    }

    Ok(GoogleSignInResult {
        success: true,
        id_token: json.get("idToken").and_then(|v| v.as_str()).map(|s| s.to_string()),
        display_name: json.get("displayName").and_then(|v| v.as_str()).map(|s| s.to_string()),
        given_name: json.get("givenName").and_then(|v| v.as_str()).map(|s| s.to_string()),
        family_name: json.get("familyName").and_then(|v| v.as_str()).map(|s| s.to_string()),
        profile_picture_uri: json.get("profilePictureUri").and_then(|v| v.as_str()).map(|s| s.to_string()),
        error: None,
    })
}

#[command]
pub async fn google_sign_in(
    filter_by_authorized_accounts: Option<bool>,
    auto_select_enabled: Option<bool>,
    nonce: String,
) -> Result<GoogleSignInResult, String> {
    #[cfg(target_os = "android")]
    {
        let filter_accounts = filter_by_authorized_accounts.unwrap_or(true);
        let auto_select = auto_select_enabled.unwrap_or(true);

        call_kotlin_google_sign_in(filter_accounts, auto_select, nonce)
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
