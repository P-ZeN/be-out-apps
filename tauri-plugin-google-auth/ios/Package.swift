// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "tauri-plugin-google-auth",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v15),
    ],
    products: [
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "tauri-plugin-google-auth",
            type: .static,
            targets: ["tauri-plugin-google-auth"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "7.0.0")
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "tauri-plugin-google-auth",
            dependencies: [
                .product(name: "Tauri", package: "Tauri"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")
            ],
            path: "Sources",
            linkerSettings: [
                .linkedFramework("UIKit", .when(platforms: [.iOS])),
                .linkedFramework("WebKit", .when(platforms: [.iOS])),
                .linkedFramework("Foundation", .when(platforms: [.iOS])),
            ]
        ),
    ]
)
