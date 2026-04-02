import { useMutation } from "@tanstack/react-query";

import { useAuth } from "./use-auth";
import { SignInPayload } from "../types/auth";

export function useSignIn() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: async (payload: SignInPayload) => {
      await signIn(payload);
    }
  });
}

