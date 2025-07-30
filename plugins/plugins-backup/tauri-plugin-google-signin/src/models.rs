use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestSignInArgs {
    pub nonce: String
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestSignInResponse {
    #[serde(default)]
    pub id_token: String,

    #[serde(default)]
    pub email: Option<String>,

    #[serde(default)]
    pub display_name: Option<String>,

    #[serde(default)]
    pub id: Option<String>,

    #[serde(default)]
    pub server_auth_code: Option<String>
}
