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
        .package(url: "https://github.com/Brendonovich/swift-rs", from: "1.0.6"),
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "7.1.0"),
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                .product(name: "SwiftRs", package: "swift-rs"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS"),
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
