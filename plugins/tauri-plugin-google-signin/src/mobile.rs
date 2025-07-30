use crate::models::GoogleSignInResult;

use crate::models::GoogleSignInResult;

pub fn call_kotlin_google_sign_in(
    _filter_by_authorized_accounts: bool,
    _auto_select_enabled: bool,
    nonce: Option<String>,
) -> Result<GoogleSignInResult, String> {
    // This function is not used in the simplified implementation
    // The actual sign-in is handled through the MainActivity bridge
    Err("Use the JavaScript bridge instead".to_string())
}

fn call_tauri_google_auth(nonce: &str) -> Result<GoogleSignInResult, String> {
    log::info!("Starting JNI call to GoogleSignInPlugin with nonce: {}", nonce);

    // For the polling approach
    let (tx, rx) = channel::<String>();

    // We'll track the state in our polling mechanism
    let callback = Arc::new(Mutex::new(Some(tx)));

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

    // Find our custom GoogleSignInPlugin class
    let auth_class = match env.find_class("com/plugin/googlesignin/GoogleSigninPlugin") {
        Ok(class) => class,
        Err(e) => {
            log::error!("Failed to find GoogleSigninPlugin class: {}", e);
            return Err(format!("Failed to find GoogleSigninPlugin class: {}", e));
        }
    };

    log::info!("Found GoogleSigninPlugin class");

    // Instead of using Java callbacks which require complex JNI proxies,
    // we'll use a simpler approach - we'll just call the sign-in method
    // and then poll for the result in a separate thread

    // Start a background thread to poll for the result
    let callback_clone = callback.clone();
    std::thread::spawn(move || {
        // Wait a bit for the sign-in intent to start
        std::thread::sleep(Duration::from_millis(500));

        // Poll for a result every second for up to 60 seconds
        for _ in 0..60 {
            std::thread::sleep(Duration::from_secs(1));

            // Check if we have a callback available
            if let Some(tx) = callback_clone.lock().unwrap().take() {
                // Send a pending status
                let _ = tx.send("{\"success\":false,\"error\":\"Waiting for user to complete Google Sign-in\"}".to_string());
                break;
            }
        }
    });

    // Create an instance of GoogleSignInPlugin
    let constructor_sig = "(Landroid/content/Context;)V";
    let plugin_instance = match env.new_object(&auth_class, constructor_sig, &[JValue::Object(&app_context)]) {
        Ok(instance) => instance,
        Err(e) => {
            log::error!("Failed to create GoogleSigninPlugin instance: {}", e);
            return Err(format!("Failed to create GoogleSigninPlugin instance: {}", e));
        }
    };

    log::info!("Created GoogleSigninPlugin instance");

    // Call the signInWithCallback method with the provided nonce and callback
    let nonce_jstring = if !nonce.is_empty() {
        match env.new_string(nonce) {
            Ok(jstring) => jstring,
            Err(e) => {
                log::error!("Failed to create nonce string: {}", e);
                return Err(format!("Failed to create nonce string: {}", e));
            }
        }
    } else {
        // Create empty string if nonce is empty
        match env.new_string("") {
            Ok(jstring) => jstring,
            Err(e) => {
                log::error!("Failed to create empty string: {}", e);
                return Err(format!("Failed to create empty string: {}", e));
            }
        }
    };

    // Just call the regular signIn method, which returns a string
    let method_name = "signIn";
    let method_sig = "(Ljava/lang/String;)Ljava/lang/String;";

    // Call the method
    let result = env.call_method(
        &plugin_instance,
        method_name,
        method_sig,
        &[JValue::Object(&nonce_jstring)],
    );

    // Check if the method call was successful
    match result {
        Ok(jvalue) => {
            // Extract string result
            match jvalue.l() {
                Ok(jobject) => {
                    // Convert the jobject to a JString and store it in a local variable that lives long enough
                    let jstring = JString::from(jobject);
                    // Extract the string content immediately and convert to owned String to avoid lifetime issues
                    let json_str = match env.get_string(&jstring) {
                        Ok(rust_string) => {
                            // Convert the JavaStr to a Rust String that we own
                            match rust_string.to_str() {
                                Ok(s) => s.to_string(),
                                Err(_) => String::new()
                            }
                        },
                        Err(e) => {
                            log::error!("Failed to get string from JString: {}", e);
                            String::new()
                        }
                    };
                    log::info!("Got initial JSON result from Java: {}", json_str);

                    // Start the polling loop
                    match rx.recv_timeout(Duration::from_secs(60)) {
                        Ok(poll_result) => {
                            log::info!("Received updated result: {}", poll_result);

                            // Parse JSON response
                            match serde_json::from_str::<GoogleSignInResult>(&poll_result) {
                                Ok(result) => Ok(result),
                                Err(e) => {
                                    log::error!("Failed to parse JSON result: {}", e);
                                    // Try to parse the original result
                                    match serde_json::from_str::<GoogleSignInResult>(&json_str) {
                                        Ok(initial_result) => Ok(initial_result),
                                        Err(_) => {
                                            Err(format!("Failed to parse JSON result: {}", e))
                                        }
                                    }
                                }
                            }
                        },
                        Err(e) => {
                            log::error!("Failed to receive updated result: {}", e);
                            // Try to parse the original result
                            match serde_json::from_str::<GoogleSignInResult>(&json_str) {
                                Ok(initial_result) => Ok(initial_result),
                                Err(e) => {
                                    log::error!("Failed to parse initial JSON result: {}", e);
                                    Err(format!("Failed to parse JSON result: {}", e))
                                }
                            }
                        }
                    }
                },
                Err(e) => {
                    log::error!("Failed to get jobject from jvalue: {}", e);
                    Err(format!("Failed to get jobject from jvalue: {}", e))
                }
            }
        },
        Err(e) => {
            log::error!("Failed to call signIn method: {}", e);
            Err(format!("Failed to call signIn method: {}", e))
        }
    }
}
