import SwiftRs
import UIKit
import WebKit
import GoogleSignIn

public class GoogleAuthPlugin: NSObject {

  public override init() {
    super.init()
    print("GoogleAuthPlugin initialized")
    configureGoogleSignIn()
  }

  deinit {
    print("GoogleAuthPlugin deinitialized")
  }

  private func configureGoogleSignIn() {
    print("GoogleAuthPlugin: Starting Google Sign-In configuration")

    // Configure Google Sign-In
    guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
          let plist = NSDictionary(contentsOfFile: path),
          let clientId = plist["CLIENT_ID"] as? String else {
      print("GoogleAuthPlugin: No GoogleService-Info.plist found, using fallback client ID")
      // Use environment variable or hardcoded fallback
      if let clientId = ProcessInfo.processInfo.environment["GOOGLE_CLIENT_ID_IOS"] {
        print("GoogleAuthPlugin: Found client ID in environment: \(clientId.prefix(10))...")
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
        print("GoogleAuthPlugin: Successfully configured with client ID from environment")
      } else {
        print("GoogleAuthPlugin: WARNING - No client ID found in environment variables either")
        print("GoogleAuthPlugin: Available environment variables: \(ProcessInfo.processInfo.environment.keys.sorted().joined(separator: ", "))")
        // Don't fail here, just log the issue
      }
      return
    }

    print("GoogleAuthPlugin: Found GoogleService-Info.plist with client ID: \(clientId.prefix(10))...")
    GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
    print("GoogleAuthPlugin: Successfully configured with client ID from plist")
  }

  @objc public func google_sign_in(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin google_sign_in called")

    guard let presentingViewController = getRootViewController() else {
      return ["error": "Unable to get presenting view controller"]
    }

    var result: [String: Any] = [:]
    let semaphore = DispatchSemaphore(value: 0)

    // Perform async Google Sign-In
    GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { signInResult, error in
      if let error = error {
        result = ["error": "Google Sign-In failed: \(error.localizedDescription)"]
      } else if let user = signInResult?.user,
                let idToken = user.idToken?.tokenString {
        let accessToken = user.accessToken.tokenString

        result = [
          "idToken": idToken,
          "accessToken": accessToken,
          "user": [
            "id": user.userID ?? "",
            "name": user.profile?.name ?? "",
            "email": user.profile?.email ?? "",
            "imageUrl": user.profile?.imageURL(withDimension: 120)?.absoluteString ?? ""
          ]
        ]
      } else {
        result = ["error": "Failed to get user or ID token"]
      }

      semaphore.signal()
    }

    // Wait for the async operation to complete
    semaphore.wait()
    return result
  }

  @objc public func google_sign_out(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin google_sign_out called")

    GIDSignIn.sharedInstance.signOut()
    return ["success": true]
  }

  @objc public func is_signed_in(_ args: [String: Any]) -> [String: Any] {
    print("GoogleAuthPlugin is_signed_in called")
    let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
    return ["isSignedIn": isSignedIn]
  }

  private func getRootViewController() -> UIViewController? {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let window = windowScene.windows.first else {
      return nil
    }
    return window.rootViewController
  }
}

@_cdecl("init_plugin_google_auth")
func initPlugin() -> UnsafeMutableRawPointer {
  print("GoogleAuthPlugin: initPlugin() called")
  do {
    let plugin = GoogleAuthPlugin()
    print("GoogleAuthPlugin: Plugin created successfully")
    return Unmanaged.passRetained(plugin).toOpaque()
  } catch {
    print("GoogleAuthPlugin: ERROR - Failed to create plugin: \(error)")
    // Return a null pointer to indicate failure
    return UnsafeMutableRawPointer(bitPattern: 0) ?? UnsafeMutableRawPointer.allocate(byteCount: 1, alignment: 1)
  }
}
