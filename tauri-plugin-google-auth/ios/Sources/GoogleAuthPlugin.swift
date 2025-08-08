import UIKit
import WebKit
import SwiftRs

class GoogleAuthPlugin {
  func ping(_ args: [String: Any]) -> [String: Any] {
    let value = args["value"] as? String ?? "default"
    return ["value": value]
  }

  func google_sign_in(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin google_sign_in called - placeholder implementation")
    return ["error": "Google Sign-In not yet implemented for iOS"]
  }

  func google_sign_out(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin google_sign_out called - placeholder implementation")
    return ["success": true]
  }

  func is_signed_in(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin is_signed_in called - placeholder implementation")
    return ["isSignedIn": false]
  }
}

@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(GoogleAuthPlugin()).toOpaque()
}
