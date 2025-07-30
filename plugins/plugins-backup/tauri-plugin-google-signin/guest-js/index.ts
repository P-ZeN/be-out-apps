import { invoke } from '@tauri-apps/api/core'

export async function requestSignin(nonce: string): Promise<{ idToken: string }> {
  return await invoke<{ idToken: string }>('plugin:google-signin|request_signin', { nonce });
}

export async function logout(): Promise<void> {
  return await invoke('plugin:google-signin|logout');
}