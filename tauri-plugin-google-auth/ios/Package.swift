// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v15),  // Set to iOS 15 for better compatibility
    ],
    products: [
        .library(
            name: "tauri-plugin-google-auth",
            type: .static,
            targets: ["tauri-plugin-google-auth"]
        ),
    ],
    dependencies: [
        // Remove GoogleSignIn dependency for now to avoid compilation issues
        // Will be dynamically loaded when needed
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                // Remove GoogleSignIn dependency
            ],
            path: "Sources",
            linkerSettings: [
                .linkedFramework("UIKit", .when(platforms: [.iOS])),
                .linkedFramework("Security", .when(platforms: [.iOS])),
                .linkedFramework("SystemConfiguration", .when(platforms: [.iOS])),
                .linkedFramework("AuthenticationServices", .when(platforms: [.iOS])),
                .linkedFramework("SafariServices", .when(platforms: [.iOS])),
                .linkedFramework("LocalAuthentication", .when(platforms: [.iOS]))
            ]
        ),
    ]
)
