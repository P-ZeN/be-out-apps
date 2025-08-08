const COMMANDS: &[&str] = &["ping", "google_sign_in", "google_sign_out", "is_signed_in"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build()
}
