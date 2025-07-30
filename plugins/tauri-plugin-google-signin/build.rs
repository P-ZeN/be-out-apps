const COMMANDS: &[&str] = &["google_sign_in", "google_sign_out"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
