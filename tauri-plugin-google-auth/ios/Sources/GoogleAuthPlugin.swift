import Foundation
import UIKit

@objc public class GoogleAuthPlugin: NSObject {
    
    @objc public static func setup() {
        print("Google Auth Plugin - iOS setup (placeholder)")
    }
    
    @objc public func ping(_ value: String?) -> [String: Any] {
        print("Google Auth Plugin - ping called with value: \(value ?? "nil")")
        return ["value": value ?? ""]
    }
    
    @objc public func googleSignIn(
        _ filterByAuthorizedAccounts: Bool,
        autoSelectEnabled: Bool,
        nonce: String?,
        webClientId: String?
    ) -> [String: Any] {
        print("Google Auth Plugin - googleSignIn called (placeholder implementation)")
        print("  filterByAuthorizedAccounts: \(filterByAuthorizedAccounts)")
        print("  autoSelectEnabled: \(autoSelectEnabled)")
        print("  nonce: \(nonce ?? "nil")")
        print("  webClientId: \(webClientId ?? "nil")")
        
        // TODO: Implement actual Google Sign-In for iOS using Google Sign-In SDK
        // For now, return a placeholder response
        return [
            "token": "placeholder_ios_token_\(Int.random(in: 1000...9999))",
            "displayName": "iOS Placeholder User",
            "email": "ios.placeholder@example.com",
            "userId": "ios_placeholder_user_\(Int.random(in: 100...999))"
        ]
    }
}

// MARK: - C-compatible functions for Tauri binding

@_cdecl("init_plugin_google_auth")
func initPluginGoogleAuth() -> UnsafeMutableRawPointer {
    let plugin = GoogleAuthPlugin()
    return Unmanaged.passRetained(plugin).toOpaque()
}

@_cdecl("plugin_google_auth_ping")
func pluginGoogleAuthPing(plugin: UnsafeMutableRawPointer, value: UnsafePointer<CChar>?) -> UnsafePointer<CChar>? {
    let pluginInstance = Unmanaged<GoogleAuthPlugin>.fromOpaque(plugin).takeUnretainedValue()
    let valueString = value != nil ? String(cString: value!) : nil
    let result = pluginInstance.ping(valueString)
    
    // Convert result to JSON string
    if let jsonData = try? JSONSerialization.data(withJSONObject: result),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        return strdup(jsonString)
    }
    return strdup("{\"value\":\"\"}")
}

@_cdecl("plugin_google_auth_sign_in")
func pluginGoogleAuthSignIn(
    plugin: UnsafeMutableRawPointer,
    filterByAuthorizedAccounts: Bool,
    autoSelectEnabled: Bool,
    nonce: UnsafePointer<CChar>?,
    webClientId: UnsafePointer<CChar>?
) -> UnsafePointer<CChar>? {
    let pluginInstance = Unmanaged<GoogleAuthPlugin>.fromOpaque(plugin).takeUnretainedValue()
    let nonceString = nonce != nil ? String(cString: nonce!) : nil
    let webClientIdString = webClientId != nil ? String(cString: webClientId!) : nil
    
    let result = pluginInstance.googleSignIn(
        filterByAuthorizedAccounts,
        autoSelectEnabled: autoSelectEnabled,
        nonce: nonceString,
        webClientId: webClientIdString
    )
    
    // Convert result to JSON string
    if let jsonData = try? JSONSerialization.data(withJSONObject: result),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        return strdup(jsonString)
    }
    return strdup("{\"error\":\"failed_to_serialize\"}")
}
