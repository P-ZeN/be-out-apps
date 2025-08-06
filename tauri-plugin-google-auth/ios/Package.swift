// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v12),  // Raise minimum to iOS 12 for better GoogleSignIn compatibility
    ],
    products: [
        .library(
            name: "tauri-plugin-google-auth",
            type: .static,
            targets: ["tauri-plugin-google-auth"]
        ),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        // Use exact version 6.2.4 to avoid compatibility issues
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "6.2.4")
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                .product(name: "Tauri", package: "Tauri"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")
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
