import UIKit
import WebKit
import SwiftRs

class GoogleAuthPlugin: Plugin {
  override func load(webview: WKWebView) {
    print("GoogleAuthPlugin loaded")
  }

  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs([String: String].self)
    let value = args["value"]
    invoke.resolve(["value": value ?? "pong"])
  }

  @objc public func google_sign_in(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin google_sign_in called - placeholder implementation")
    invoke.reject("Google Sign-In not yet implemented for iOS")
  }

  @objc public func google_sign_out(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin google_sign_out called - placeholder implementation")
    invoke.resolve(["success": true])
  }

  @objc public func is_signed_in(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin is_signed_in called - placeholder implementation")
    invoke.resolve(["isSignedIn": false])
  }
}

@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> Plugin {
    return GoogleAuthPlugin()
}
