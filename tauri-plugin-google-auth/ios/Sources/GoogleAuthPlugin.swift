import Foundation
import UIKit
import GoogleSignIn
import SwiftRs
import Tauri
import WebKit

class GoogleAuthPlugin: Plugin {

    public override func load(webview: WKWebView) {
        super.load(webview: webview)

        // Configure Google Sign-In
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let clientId = getClientIdFromPlist(path: path) {
            let config = GIDConfiguration(clientID: clientId)
            GIDSignIn.sharedInstance.configuration = config
            print("GoogleAuthPlugin: Configured with client ID: \(clientId)")
        } else {
            print("GoogleAuthPlugin: Warning - GoogleService-Info.plist not found or invalid")
        }
    }

    private func getClientIdFromPlist(path: String) -> String? {
        guard let plist = NSDictionary(contentsOfFile: path),
              let clientId = plist["CLIENT_ID"] as? String else {
            return nil
        }
        return clientId
    }

    @objc func ping(_ invoke: Invoke) {
        do {
            let args = try invoke.parseArgs(PingRequest.self)
            let value = args.value ?? "default"
            invoke.resolve(["value": value])
        } catch {
            invoke.reject("Failed to parse arguments", code: "PARSE_ERROR")
        }
    }

    @objc func googleSignIn(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(GoogleSignInRequest.self)

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            invoke.reject("No root view controller found", code: "NO_VIEW_CONTROLLER")
            return
        }

        // Configure additional options if provided
        if let webClientId = args.webClientId {
            let config = GIDConfiguration(clientID: webClientId)
            GIDSignIn.sharedInstance.configuration = config
        }

        // Perform sign-in
        GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { result, error in
            if let error = error {
                invoke.reject("Google Sign-In failed: \(error.localizedDescription)", code: "SIGNIN_FAILED")
                return
            }

            guard let result = result else {
                invoke.reject("No sign-in result", code: "NO_RESULT")
                return
            }

            let user = result.user
            let profile = user.profile
            let idToken = user.idToken?.tokenString
            let accessToken = user.accessToken.tokenString

            let response: [String: Any] = [
                "token": accessToken,
                "idToken": idToken ?? "",
                "displayName": profile?.name ?? "",
                "email": profile?.email ?? "",
                "userId": user.userID ?? "",
                "photoUrl": profile?.imageURL(withDimension: 320)?.absoluteString ?? "",
                "givenName": profile?.givenName ?? "",
                "familyName": profile?.familyName ?? ""
            ]

            invoke.resolve(response)
        }
    }

    @objc func googleSignOut(_ invoke: Invoke) {
        GIDSignIn.sharedInstance.signOut()
        invoke.resolve(["success": true])
    }

    @objc func isSignedIn(_ invoke: Invoke) {
        let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
        invoke.resolve(["isSignedIn": isSignedIn])
    }
}

// MARK: - Request/Response Models

struct PingRequest: Decodable {
    let value: String?
}

struct GoogleSignInRequest: Decodable {
    let filterByAuthorizedAccounts: Bool?
    let autoSelectEnabled: Bool?
    let nonce: String?
    let webClientId: String?
}

// MARK: - Plugin Registration

@_cdecl("init_plugin_google_auth")
func initPluginGoogleAuth() -> Plugin {
    return GoogleAuthPlugin()
}
