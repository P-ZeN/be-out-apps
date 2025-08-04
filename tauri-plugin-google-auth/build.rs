const COMMANDS: &[&str] = &["ping", "google_sign_in"];

fn main() {
  // Set the links field programmatically to satisfy the tauri-plugin builder
  println!("cargo:rerun-if-changed=build.rs");
  
  let result = tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .try_build();

  // when building documentation for Android/iOS the plugin build result is always Err() and is irrelevant to the crate documentation build
  if !(cfg!(docsrs) && (std::env::var("TARGET").unwrap_or_default().contains("android") || std::env::var("TARGET").unwrap_or_default().contains("ios"))) {
    result.unwrap();
  }
}
