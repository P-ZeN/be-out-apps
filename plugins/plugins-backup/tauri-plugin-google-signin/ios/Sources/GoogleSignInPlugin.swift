import SwiftRs
import Tauri
import UIKit
import WebKit
import GoogleSignIn

class GoogleSignInArgs: Decodable {
    let nonce: String
}

class GoogleSignInResponse: Encodable {
    init(_ idToken: String) {
        self.idToken = idToken
    }
    
    let idToken: String
}

class GoogleSignInPlugin: Plugin {
    @objc public func request_signin(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(GoogleSignInArgs.self)
        let keyWindow = UIApplication.shared.windows.filter { $0.isKeyWindow }.first;
        
        guard var topController = keyWindow?.rootViewController else {
            return invoke.reject("no key window")
        }
        
        while let presentedViewController = topController.presentedViewController {
            topController = presentedViewController
        }
        
        GIDSignIn.sharedInstance.signIn(
            withPresenting: topController,
            hint: nil,
            additionalScopes: ["https://www.googleapis.com/auth/userinfo.profile"],
            nonce: args.nonce
        ) { result, error in
            guard error == nil else {
                return invoke.reject(error?.localizedDescription ?? "unknown error")
            }
            
            guard let result else {
                return invoke.reject("result on callback was nill")
            }
            
            guard let idToken = result.user.idToken?.tokenString else {
                return invoke.reject("response did not contain user id token")
            }
            
            invoke.resolve(GoogleSignInResponse(idToken))
        }
    }
    
    
    @objc public func signout(_ invoke: Invoke) throws {
        GIDSignIn.sharedInstance.signOut()
        invoke.resolve()
    }
}

@_cdecl("init_plugin_google_signin")
func initPlugin() -> Plugin {
    return GoogleSignInPlugin()
}
