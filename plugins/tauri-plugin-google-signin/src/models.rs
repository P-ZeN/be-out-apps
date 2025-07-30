use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleSignInResult {
    pub success: bool,
    pub id_token: Option<String>,
    pub display_name: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub profile_picture_uri: Option<String>,
    pub error: Option<String>,
}
