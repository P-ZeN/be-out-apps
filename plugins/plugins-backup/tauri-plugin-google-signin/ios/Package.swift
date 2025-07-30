// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "tauri-plugin-google-signin",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13),
    ],
    products: [
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "tauri-plugin-google-signin",
            type: .static,
            targets: ["tauri-plugin-google-signin"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        .package(name: "GoogleSignIn", url: "https://github.com/google/GoogleSignIn-iOS", from: "8.1.0-vwg-eap-1.0.0")
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "tauri-plugin-google-signin",
            dependencies: [
                .byName(name: "Tauri"),
                .byName(name: "GoogleSignIn")
            ],
            path: "Sources"
        )
    ]
)
