// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .iOS(.v15),
        .macOS(.v10_15)
    ],
    products: [
        .library(
            name: "tauri-plugin-google-auth",
            type: .static,
            targets: ["tauri-plugin-google-auth"]
        )
    ],
    dependencies: [
        .package(name: "GoogleSignIn", url: "https://github.com/google/GoogleSignIn-iOS", from: "6.2.0")
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                .product(name: "GoogleSignIn", package: "GoogleSignIn")
            ],
            path: "Sources"
        )
    ]
)
