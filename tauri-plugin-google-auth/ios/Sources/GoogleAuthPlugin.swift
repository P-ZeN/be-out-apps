import UIKit
import WebKit
import Tauri

class GoogleAuthPlugin: Plugin {
  @objc public override func load(webview: WKWebView) {
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
func init_plugin_google_auth() -> Plugin {
    return GoogleAuthPlugin()
}
