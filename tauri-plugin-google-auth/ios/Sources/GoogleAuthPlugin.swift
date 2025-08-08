import UIKit
import WebKit

#if canImport(Tauri)
import Tauri

class GoogleAuthPlugin: Plugin {
  private var isConfigured = false

  @objc public func load(webview: WKWebView) {
    // No Google SDK initialization during load to prevent startup crashes
    print("GoogleAuthPlugin loaded - Google SDK imports completely deferred")
  }

  private func ensureGoogleSDKAvailable() -> Bool {
    // Check if GoogleSignIn SDK is available at runtime
    guard NSClassFromString("GIDSignIn") != nil else {
      print("GoogleSignIn SDK not available")
      return false
    }
    return true
  }

  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs([String: String].self)
    let value = args["value"]
    invoke.resolve(["value": value ?? ""])
  }

  @objc public func signIn(_ invoke: Invoke) throws {
    // Check Google SDK availability before attempting to use it
    guard ensureGoogleSDKAvailable() else {
      invoke.reject("Google Sign-In SDK not available")
      return
    }

    // TODO: Implement dynamic loading of GoogleSignIn classes
    // For now, return placeholder
    print("GoogleAuthPlugin signIn called - placeholder implementation")
    invoke.reject("Google Sign-In implementation not yet complete")
  }

  @objc public func signOut(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin signOut called - placeholder implementation")
    invoke.resolve(["success": true])
  }

  @objc public func isSignedIn(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin isSignedIn called - placeholder implementation")
    invoke.resolve(["isSignedIn": false])
  }
}

@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(GoogleAuthPlugin()).toOpaque()
}

#else
// Fallback implementation for standalone Swift compilation without Tauri
protocol Plugin {
    func load(webview: WKWebView)
}

protocol Invoke {
    func parseArgs<T: Decodable>(_ type: T.Type) throws -> T
    func resolve(_ data: [String: Any])
    func reject(_ message: String)
}

class GoogleAuthPlugin: Plugin {
  @objc public func load(webview: WKWebView) {
    print("GoogleAuthPlugin loaded - standalone compilation")
  }

  @objc public func ping() {
    print("GoogleAuthPlugin: ping method (stub)")
  }

  @objc public func googleSignIn() {
    print("GoogleAuthPlugin: googleSignIn method (stub)")
  }

  @objc public func googleSignOut() {
    print("GoogleAuthPlugin: googleSignOut method (stub)")
  }

  @objc public func isSignedIn() {
    print("GoogleAuthPlugin: isSignedIn method (stub)")
  }
}

// CRITICAL: Export function must be available in both compilation paths for swift-rs
@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(GoogleAuthPlugin()).toOpaque()
}
#endif
