import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { getSessionProfile, signIn } from "../services/auth-service";
import { getApiErrorMessage, setUnauthorizedHandler } from "../services/api";
import { SignInPayload, AuthUser } from "../types/auth";
import { clearAuthSession, getAuthToken, getAuthUser, setAuthSession } from "../utils/storage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  const handleSignIn = useCallback(async (payload: SignInPayload) => {
    try {
      const session = await signIn(payload);

      await setAuthSession(session.token, session.user);

      setToken(session.token);
      setUser(session.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([getAuthToken(), getAuthUser()]);

        if (!storedToken || !storedUser) {
          await clearAuthSession();
          setToken(null);
          setUser(null);
          return;
        }

        const profile = await getSessionProfile();
        const hydratedUser: AuthUser = {
          ...storedUser,
          id: profile.userId,
          departmentId: profile.departmentId,
          role: profile.role
        };

        await setAuthSession(storedToken, hydratedUser);

        setToken(storedToken);
        setUser(hydratedUser);
      } catch {
        await clearAuthSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrapSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      signIn: handleSignIn,
      signOut
    }),
    [handleSignIn, isBootstrapping, signOut, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
