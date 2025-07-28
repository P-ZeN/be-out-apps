package com.beout.app.googlesignin

interface SignInCallback {
    fun onResult(success: Boolean, result: String, error: String?)
}

interface SignOutCallback {
    fun onResult(success: Boolean, error: String?)
}
