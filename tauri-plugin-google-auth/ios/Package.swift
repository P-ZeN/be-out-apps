// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "tauri-plugin-google-auth",
            type: .static,
            targets: ["tauri-plugin-google-auth"]
        )
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        .package(name: "GoogleSignIn", url: "https://github.com/google/GoogleSignIn-iOS", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                .byName(name: "Tauri"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn")
            ],
            path: "Sources"
        )
    ]
)
