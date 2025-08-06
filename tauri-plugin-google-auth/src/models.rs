use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
  pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleSignInRequest {
  pub filter_by_authorized_accounts: Option<bool>,
  pub auto_select_enabled: Option<bool>,
  pub nonce: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleSignInResponse {
  pub success: bool,
  pub id_token: Option<String>,
  pub display_name: Option<String>,
  pub given_name: Option<String>,
  pub family_name: Option<String>,
  pub profile_picture_uri: Option<String>,
  pub email: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleSignOutResponse {
  pub success: bool,
  pub error: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IsSignedInResponse {
  pub is_signed_in: bool,
  pub error: Option<String>,
}
