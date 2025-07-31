import { invoke } from '@tauri-apps/api/core'

export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:google-auth|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

export interface GoogleSignInOptions {
  filterByAuthorizedAccounts?: boolean;
  autoSelectEnabled?: boolean;
  nonce?: string;
}

export interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  profilePictureUri?: string;
  error?: string;
}

export async function googleSignIn(options: GoogleSignInOptions = {}): Promise<GoogleSignInResult> {
  return await invoke<GoogleSignInResult>('plugin:google-auth|google_sign_in', {
    payload: options,
  });
}
