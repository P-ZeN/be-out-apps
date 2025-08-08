import SwiftRs
import Tauri
import UIKit
import WebKit
import GoogleSignIn

// Decodable structs for command arguments
class GoogleSignInArgs: Decodable {
  let value: String?
}

class GoogleAuthPlugin: Plugin {
  
  // Override load method to initialize Google Sign-In when webview is created
  override func load(webview: WKWebView) {
    super.load(webview: webview)
    configureGoogleSignIn()
  }
  
  private func configureGoogleSignIn() {
    // Configure Google Sign-In
    guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
          let plist = NSDictionary(contentsOfFile: path),
          let clientId = plist["CLIENT_ID"] as? String else {
      print("GoogleAuthPlugin: No GoogleService-Info.plist found, using fallback client ID")
      // Use environment variable or hardcoded fallback
      if let clientId = ProcessInfo.processInfo.environment["GOOGLE_CLIENT_ID_IOS"] {
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
        print("GoogleAuthPlugin: Configured with client ID from environment: \(clientId)")
      } else {
        print("GoogleAuthPlugin: No client ID found in environment variables either")
      }
      return
    }
    
    GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
    print("GoogleAuthPlugin: Configured with client ID from plist: \(clientId)")
  }

  @objc public func google_sign_in(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin google_sign_in called")
    
    guard let presentingViewController = manager.viewController else {
      invoke.reject("Unable to get presenting view controller")
      return
    }
    
    // Perform async Google Sign-In
    GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { [weak self] result, error in
      DispatchQueue.main.async {
        if let error = error {
          invoke.reject("Google Sign-In failed: \(error.localizedDescription)")
          return
        }
        
        guard let user = result?.user,
              let idToken = user.idToken?.tokenString else {
          invoke.reject("Failed to get user or ID token")
          return
        }
        
        let accessToken = user.accessToken.tokenString
        
        let response: [String: Any] = [
          "idToken": idToken,
          "accessToken": accessToken,
          "user": [
            "id": user.userID ?? "",
            "name": user.profile?.name ?? "",
            "email": user.profile?.email ?? "",
            "imageUrl": user.profile?.imageURL(withDimension: 120)?.absoluteString ?? ""
          ]
        ]
        
        invoke.resolve(response)
      }
    }
  }

  @objc public func google_sign_out(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin google_sign_out called")
    
    GIDSignIn.sharedInstance.signOut()
    invoke.resolve(["success": true])
  }

  @objc public func is_signed_in(_ invoke: Invoke) throws {
    print("GoogleAuthPlugin is_signed_in called")
    let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
    invoke.resolve(["isSignedIn": isSignedIn])
  }
}

@_cdecl("init_plugin_google_auth")
func initPlugin() -> Plugin {
  return GoogleAuthPlugin()
}
