import Foundation
import UIKit
import GoogleSignIn
import SwiftRs
import Tauri
import WebKit

class GoogleAuthPlugin: Plugin {
    
    public override func load(webview: WKWebView) {
        super.load(webview)
        
        // Configure Google Sign-In
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let clientId = getClientIdFromPlist(path: path) {
            guard let config = GIDConfiguration(clientID: clientId) else {
                print("GoogleAuthPlugin: Failed to create GIDConfiguration")
                return
            }
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
        let args = invoke.parseArgs(PingRequest.self)
        let value = args?.value ?? "default"
        invoke.resolve(["value": value])
    }
    
    @objc func googleSignIn(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(GoogleSignInRequest.self)
        
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            invoke.reject("No root view controller found", code: "NO_VIEW_CONTROLLER")
            return
        }
        
        // Configure additional options if provided
        if let webClientId = args.webClientId,
           let config = GIDConfiguration(clientID: webClientId) {
            GIDSignIn.sharedInstance.configuration = config
        }
        
        // Perform sign-in
        GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { [weak self] result, error in
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

    // Convert result to JSON string
    if let jsonData = try? JSONSerialization.data(withJSONObject: result),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        return strdup(jsonString)
    }
    return strdup("{\"value\":\"\"}")
}

@_cdecl("plugin_google_auth_sign_in")
func pluginGoogleAuthSignIn(
    plugin: UnsafeMutableRawPointer,
    filterByAuthorizedAccounts: Bool,
    autoSelectEnabled: Bool,
    nonce: UnsafePointer<CChar>?,
    webClientId: UnsafePointer<CChar>?
) -> UnsafePointer<CChar>? {
    let pluginInstance = Unmanaged<GoogleAuthPlugin>.fromOpaque(plugin).takeUnretainedValue()
    let nonceString = nonce != nil ? String(cString: nonce!) : nil
    let webClientIdString = webClientId != nil ? String(cString: webClientId!) : nil

    let result = pluginInstance.googleSignIn(
        filterByAuthorizedAccounts,
        autoSelectEnabled: autoSelectEnabled,
        nonce: nonceString,
        webClientId: webClientIdString
    )

    // Convert result to JSON string
    if let jsonData = try? JSONSerialization.data(withJSONObject: result),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        return strdup(jsonString)
    }
    return strdup("{\"error\":\"failed_to_serialize\"}")
}
