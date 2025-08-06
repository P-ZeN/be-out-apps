import Tauri
import UIKit
import WebKit
import GoogleSignIn

class GoogleAuthPlugin: Plugin {
  @objc public override func load(webview: WKWebView) {
    // Configure Google Sign-In with the client ID from Tauri config
    let clientId = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
    
    guard let config = GIDConfiguration(clientID: clientId) else {
      print("Error: Failed to create GIDConfiguration")
      return
    }
    
    GIDSignIn.sharedInstance.configuration = config
    print("GoogleAuthPlugin loaded - Google Sign-In SDK configured")
  }

  @objc public func ping(_ invoke: Invoke) throws {
    let args = invoke.parseArgs([String: String].self)
    let value = args["value"]
    invoke.resolve(["value": value ?? ""])
  }

  @objc public func googleSignIn(_ invoke: Invoke) throws {
    guard let presentingViewController = UIApplication.shared.windows.first?.rootViewController else {
      invoke.reject("No presenting view controller available")
      return
    }
    
    // Use GoogleSignIn 6.x API
    GIDSignIn.sharedInstance.signIn(with: GIDSignIn.sharedInstance.configuration!, presenting: presentingViewController) { user, error in
      if let error = error {
        invoke.reject("Google Sign-In failed: \(error.localizedDescription)")
        return
      }
      
      guard let user = user,
            let authentication = user.authentication,
            let idToken = authentication.idToken else {
        invoke.reject("Failed to get user information or ID token")
        return
      }
      
      let accessToken = authentication.accessToken
      let profile = user.profile
      
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
