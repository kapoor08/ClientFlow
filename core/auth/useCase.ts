"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "./repository";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

function useInvalidateAuth() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: authKeys.all,
    });
}

export function useAuthSession() {
  return authClient.useSession();
}

export function useSignIn() {
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: signInWithEmail,
    onSuccess: invalidateAuth,
  });
}

export function useGoogleSignIn() {
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: invalidateAuth,
  });
}

export function useSignUp() {
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: signUpWithEmail,
    onSuccess: invalidateAuth,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: requestPasswordReset,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: resendVerificationEmail,
  });
}

export function useSignOut() {
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: signOutUser,
    onSuccess: invalidateAuth,
  });
}
