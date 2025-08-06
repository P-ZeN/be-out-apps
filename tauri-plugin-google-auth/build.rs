const COMMANDS: &[&str] = &["ping", "googleSignIn", "googleSignOut", "isSignedIn"];

fn main() {
    // For iOS builds, we want to skip the plugin build if it causes issues
    #[cfg(target_os = "ios")]
    {
        println!("cargo:warning=Building tauri-plugin-google-auth for iOS target");
    }

    let result = tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .try_build();

    // when building documentation for Android the plugin build result is always Err() and is irrelevant to the crate documentation build
    if !(cfg!(docsrs) && std::env::var("TARGET").unwrap_or_default().contains("android")) {
        // For iOS target, if build fails, just emit a warning instead of failing
        if std::env::var("TARGET").unwrap_or_default().contains("ios") {
            if let Err(e) = result {
                println!("cargo:warning=iOS plugin build failed: {}", e);
                println!("cargo:warning=Continuing build without plugin functionality");
                return;
            }
        } else {
            result.unwrap();
        }
    }
}
