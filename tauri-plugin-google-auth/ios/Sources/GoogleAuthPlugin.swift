import UIKit
import WebKit

#if canImport(Tauri)
import Tauri

class GoogleAuthPlugin: Plugin {
  @objc public func load(webview: WKWebView) {
    // Completely defer all Google SDK dependencies
    print("GoogleAuthPlugin loaded - all Google SDK interaction deferred")
  }

  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs([String: String].self)
    let value = args["value"]
    invoke.resolve(["value": value ?? ""])
  }

  @objc public func signIn(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin signIn called - placeholder implementation")
    invoke.reject("Google Sign-In not yet implemented - requires dynamic SDK loading")
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
