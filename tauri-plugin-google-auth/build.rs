const COMMANDS: &[&str] = &["ping", "googleSignIn", "googleSignOut", "isSignedIn"];

fn main() {
    // Add more detailed logging for iOS builds
    if cfg!(target_os = "ios") {
        println!("cargo:warning=Building tauri-plugin-google-auth for iOS target");

        // Check iOS environment before attempting build
        println!("cargo:warning=iOS Environment Check:");

        // Check if we're in a CI environment
        if std::env::var("CI").is_ok() {
            println!("cargo:warning=Running in CI environment");
        }

        // Check for required iOS SDK
        if let Ok(output) = std::process::Command::new("xcrun")
            .args(&["--show-sdk-path", "--sdk", "iphoneos"])
            .output()
        {
            if output.status.success() {
                let sdk_path = String::from_utf8_lossy(&output.stdout);
                let sdk_path = sdk_path.trim();
                println!("cargo:warning=iOS SDK found at: {}", sdk_path);
            } else {
                println!("cargo:warning=iOS SDK not found via xcrun");
            }
        }

        // Check Swift compiler availability
        if let Ok(output) = std::process::Command::new("swift")
            .args(&["--version"])
            .output()
        {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                let version = version.trim();
                println!("cargo:warning=Swift compiler available: {}", version);
            } else {
                println!("cargo:warning=Swift compiler available but version check failed");
            }
        } else {
            println!("cargo:warning=Swift compiler not available or not in PATH");
        }

        // Check if Package.swift exists
        let package_swift_path = std::path::Path::new("ios/Package.swift");
        if package_swift_path.exists() {
            println!("cargo:warning=Package.swift found at ios/Package.swift");

            // Try to validate Package.swift syntax
            if let Ok(output) = std::process::Command::new("swift")
                .args(&["package", "dump-package"])
                .current_dir("ios")
                .output()
            {
                if output.status.success() {
                    println!("cargo:warning=Package.swift syntax appears valid");
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    let error = error.trim();
                    println!("cargo:warning=Package.swift syntax validation failed: {}", error);
                }
            }
        } else {
            println!("cargo:warning=Package.swift NOT found at ios/Package.swift - this will cause build failure");
        }

        // Set additional environment variables for debugging
        println!("cargo:rustc-env=TAURI_PLUGIN_GOOGLE_AUTH_IOS_BUILD=1");
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
                eprintln!("cargo:warning=iOS build failure detected. Common causes:");
                eprintln!("cargo:warning=1. Missing iOS frameworks (check linkerSettings in Package.swift)");
                eprintln!("cargo:warning=2. Swift compilation errors (dependency version conflicts)");
                eprintln!("cargo:warning=3. GoogleSignIn SDK version incompatibility with Xcode version");
                eprintln!("cargo:warning=4. swift-rs crate compilation failure");
                eprintln!("cargo:warning=5. Missing or invalid Package.swift configuration");

                // Try to get more specific error information from swift-rs
                let error_string = format!("{}", e);
                if error_string.contains("Failed to compile swift package") {
                    eprintln!("cargo:warning=Specific issue: Swift package compilation failed");
                    eprintln!("cargo:warning=This usually means either:");
                    eprintln!("cargo:warning=  - Dependency resolution failed (version conflicts)");
                    eprintln!("cargo:warning=  - Swift syntax errors in source files");
                    eprintln!("cargo:warning=  - Missing or incompatible system frameworks");
                    eprintln!("cargo:warning=  - Xcode/Swift compiler version incompatibility");
                }

                if error_string.contains("swift-rs") {
                    eprintln!("cargo:warning=swift-rs crate error detected");
                    eprintln!("cargo:warning=This is typically due to Swift package manager build failures");
                }
            }

            std::process::exit(1);
        }
    }
}
