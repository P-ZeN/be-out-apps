// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .iOS(.v12)
    ],
    products: [
        .library(
            name: "tauri-plugin-google-auth",
            targets: ["tauri-plugin-google-auth"]
        )
    ],
    dependencies: [
        // Tauri iOS API will be linked at build time
    ],
    targets: [
        .target(
            name: "tauri-plugin-google-auth",
            path: "Sources",
            publicHeadersPath: "."
        )
    ]
)
