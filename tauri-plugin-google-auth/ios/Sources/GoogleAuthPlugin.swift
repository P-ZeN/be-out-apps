import UIKit
import WebKit
import GoogleSignIn

#if canImport(Tauri)
import Tauri

class GoogleAuthPlugin: Plugin {
#else
// Fallback stub protocols for standalone compilation
protocol Plugin {
    func load(webview: WKWebView)
}

protocol Invoke {
    func parseArgs<T: Decodable>(_ type: T.Type) throws -> T
    func resolve(_ data: [String: Any])
    func reject(_ message: String)
}

class GoogleAuthPlugin: Plugin {
#endif
  private var googleSignInConfig: GIDConfiguration?

  @objc public func load(webview: WKWebView) {
    // Configure Google Sign-In with the client ID from Tauri config
    let clientId = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"

    let config = GIDConfiguration(clientID: clientId)

    // Store configuration for use in signIn method
    self.googleSignInConfig = config
    print("GoogleAuthPlugin loaded - Google Sign-In SDK configured")
  }

#if canImport(Tauri)
  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs([String: String].self)
    let value = args["value"]
    invoke.resolve(["value": value ?? ""])
  }

  @objc public func googleSignIn(_ invoke: Invoke) throws {
    guard let config = self.googleSignInConfig else {
      invoke.reject("GoogleSignIn not configured")
      return
    }

    // Use modern iOS 15+ method to get the presenting view controller
    var presentingViewController: UIViewController?

    if #available(iOS 15.0, *) {
      // iOS 15+ method using UIWindowScene
      if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
         let window = windowScene.windows.first {
        presentingViewController = window.rootViewController
      }
    } else {
      // Fallback for iOS 12-14
      presentingViewController = UIApplication.shared.windows.first?.rootViewController
    }

    guard let presentingVC = presentingViewController else {
      invoke.reject("No presenting view controller available")
      return
    }

    // GoogleSignIn 6.x API: Pass configuration directly to signIn method
    GIDSignIn.sharedInstance.signIn(with: config, presenting: presentingVC) { result, error in
      if let error = error {
        invoke.reject("Google Sign-In failed: \(error.localizedDescription)")
        return
      }

      guard let result = result,
            let idToken = result.idToken?.tokenString else {
        invoke.reject("Failed to get user information or ID token")
        return
      }

      let accessToken = result.accessToken.tokenString
      let profile = result.profile

      invoke.resolve([
        "success": true,
        "error": "",
        "idToken": idToken,
        "accessToken": accessToken,
        "displayName": profile?.name ?? "",
        "email": profile?.email ?? "",
        "photoUrl": profile?.imageURL(withDimension: 200)?.absoluteString ?? ""
      ])
    }
  }

  @objc public func googleSignOut(_ invoke: Invoke) throws {
    GIDSignIn.sharedInstance.signOut()
    invoke.resolve(["success": true])
  }

  @objc public func isSignedIn(_ invoke: Invoke) throws {
    let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
    invoke.resolve(["isSignedIn": isSignedIn])
  }
#else
  // Stub implementations for standalone compilation
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
#endif
}

#if canImport(Tauri)
@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(GoogleAuthPlugin()).toOpaque()
}
#endif
