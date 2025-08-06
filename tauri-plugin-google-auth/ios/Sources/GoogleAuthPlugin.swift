import Tauri
import UIKit
import WebKit
import GoogleSignIn

class GoogleAuthPlugin: Plugin {
  private var googleSignInConfig: GIDConfiguration?
  
  @objc public override func load(webview: WKWebView) {
    // Configure Google Sign-In with the client ID from Tauri config
    let clientId = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"

    guard let config = GIDConfiguration(clientID: clientId) else {
      print("Error: Failed to create GIDConfiguration")
      return
    }
    
    // Store configuration for use in signIn method
    self.googleSignInConfig = config
    print("GoogleAuthPlugin loaded - Google Sign-In SDK configured")
  }  @objc public func ping(_ invoke: Invoke) throws {
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
            let idToken = result.user.idToken?.tokenString else {
        invoke.reject("Failed to get user information or ID token")
        return
      }

      let accessToken = result.user.accessToken.tokenString
      let profile = result.user.profile

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
}

@_cdecl("init_plugin_google_auth")
func init_plugin_google_auth() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(GoogleAuthPlugin()).toOpaque()
}
