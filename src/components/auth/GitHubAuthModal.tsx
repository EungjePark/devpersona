"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "sign-in" | "sign-up";
}

export function GitHubAuthModal({ isOpen, onClose, mode = "sign-in" }: GitHubAuthModalProps) {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isLoaded = mode === "sign-in" ? signInLoaded : signUpLoaded;

  // Handle client-side mounting for Portal
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Required for SSR hydration
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleGitHubAuth = useCallback(async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const auth = mode === "sign-in" ? signIn : signUp;
      if (!auth) return;

      await auth.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("GitHub auth error:", err);
      setError("Failed to connect with GitHub. Please try again.");
      setIsLoading(false);
    }
  }, [isLoaded, mode, signIn, signUp]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4",
          "animate-in zoom-in-95 fade-in duration-300 ease-out"
        )}
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-violet-600/30 rounded-3xl blur-xl opacity-75" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          {/* Decorative gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="px-8 py-10">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 mb-5 shadow-lg">
                <svg
                  className="w-9 h-9 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === "sign-in" ? "Welcome back" : "Join DevPersona"}
              </h2>
              <p className="text-zinc-400 text-sm">
                {mode === "sign-in"
                  ? "Sign in with your GitHub account to continue"
                  : "Connect your GitHub to discover your developer archetype"}
              </p>
            </div>

            {/* GitHub Button */}
            <button
              onClick={handleGitHubAuth}
              disabled={!isLoaded || isLoading}
              className={cn(
                "group relative w-full flex items-center justify-center gap-3",
                "py-4 px-6 rounded-xl",
                "bg-white text-black font-semibold",
                "shadow-lg shadow-white/10",
                "transition-all duration-300",
                "hover:shadow-xl hover:shadow-white/20 hover:scale-[1.02]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                "overflow-hidden"
              )}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-white to-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative flex items-center gap-3">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>
                  {isLoading
                    ? "Connecting..."
                    : mode === "sign-in"
                    ? "Continue with GitHub"
                    : "Sign up with GitHub"}
                </span>
              </span>
            </button>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Toggle mode */}
            <p className="text-center text-zinc-500 text-sm mt-6">
              {mode === "sign-in" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      // Could switch mode here if needed
                    }}
                    className="text-white hover:text-violet-400 transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                    }}
                    className="text-white hover:text-violet-400 transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/5 bg-zinc-900/50">
            <p className="text-center text-zinc-600 text-xs flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              We only access your public GitHub profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Use Portal to render modal at document body level for proper centering
  return createPortal(modalContent, document.body);
}
