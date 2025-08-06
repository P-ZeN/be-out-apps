const COMMANDS: &[&str] = &["ping", "googleSignIn", "googleSignOut", "isSignedIn"];

fn main() {
    // Add more detailed logging for iOS builds
    if cfg!(target_os = "ios") {
        println!("cargo:warning=Building tauri-plugin-google-auth for iOS target");

        // Set additional environment variables for debugging
        println!("cargo:rustc-env=TAURI_PLUGIN_GOOGLE_AUTH_IOS_BUILD=1");

        // Try to detect Swift compilation issues early
        if let Err(e) = std::process::Command::new("swift")
            .args(&["--version"])
            .output()
        {
            println!("cargo:warning=Swift compiler not available: {}", e);
        }
    }

    match tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .try_build()
    {
        Ok(_) => {
            println!("cargo:warning=tauri-plugin-google-auth build completed successfully");
        }
        Err(e) => {
            eprintln!("cargo:warning=tauri-plugin-google-auth build failed: {}", e);

            // For iOS builds, provide more context
            if cfg!(target_os = "ios") {
                eprintln!("cargo:warning=iOS build failure detected. This may be due to:");
                eprintln!("cargo:warning=1. Missing iOS frameworks");
                eprintln!("cargo:warning=2. Swift compilation errors");
                eprintln!("cargo:warning=3. GoogleSignIn SDK version incompatibility");
                eprintln!("cargo:warning=4. Xcode version compatibility issues");
            }

            std::process::exit(1);
        }
    }
}
