"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export type AuthMode = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

function AuthModal({ onClose, isOpen, mode, onModeChange }: AuthModalProps) {
  const [registeredEmail, setRegisteredEmail] = useState("");
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-line/80 p-6 sm:p-8 z-10 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Close Button */}
            <button
              id="auth-modal-close-btn"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-subtle hover:text-foreground hover:bg-surface-muted transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Apple-style Brand Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-action text-action-foreground mx-auto shadow-xs">
                <span className="text-lg font-semibold tracking-tighter">
                  A
                </span>
              </div>
              <h2
                id="auth-modal-title"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                {mode === "signin" ? "Atelier Account" : "Create Atelier ID"}
              </h2>
              <p className="text-xs text-muted max-w-xs mx-auto">
                {mode === "signin"
                  ? "Đăng nhập để quản lý tài khoản của bạn."
                  : "Tạo tài khoản để bắt đầu trò chuyện."}
              </p>
            </div>

            {/* Apple-style Segmented Control */}
            <div className="p-1 bg-surface-muted rounded-full flex items-center mb-6">
              <button
                type="button"
                id="auth-tab-signin"
                onClick={() => onModeChange("signin")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  mode === "signin"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Đăng Nhập (Sign In)
              </button>
              <button
                type="button"
                id="auth-tab-signup"
                onClick={() => onModeChange("signup")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Đăng Ký (Register)
              </button>
            </div>

            <div className="mt-4">
              {mode === "signin" ? (
                <SignInForm
                  onSuccess={onClose}
                  initialEmail={registeredEmail}
                />
              ) : (
                <SignUpForm
                  onSuccess={(email) => {
                    setRegisteredEmail(email);
                    onModeChange("signin");
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
