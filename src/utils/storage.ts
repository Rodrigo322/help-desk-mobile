import * as SecureStore from "expo-secure-store";

import { AuthUser } from "../types/auth";

const AUTH_TOKEN_KEY = "helpdesk.auth.token";
const AUTH_USER_KEY = "helpdesk.auth.user";

export async function setAuthSession(token: string, user: AuthUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
    SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user))
  ]);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const rawUser = await SecureStore.getItemAsync(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY)
  ]);
}

