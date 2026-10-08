"use client";

import { AuthModal, useLogout } from "@/src/features/auth";
import type { AuthMode } from "@/src/features/auth/components/AuthModal";
import { useAuthStore } from "@/store";
import {
  Briefcase,
  Computer,
  Shirt,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const user = useAuthStore((state) => state.user);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [isAuthOpen, setAuthOpen] = useState(false);
  const { mutate: logout, isPending: isSigningOut } = useLogout();
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(en|vi)/, "") || "/";

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  const navLinks = [
    { icon: MessageCircle, name: "Spaces", path: "/chat" },
    { icon: TrendingUp, name: "Trending", path: "/new" },
    { icon: Shirt, name: "clothing", path: "/clothes" },
    { icon: Briefcase, name: "accessories", path: "/accessory" },
    { icon: Computer, name: "technical", path: "/technical" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6 lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-tighter text-foreground"
            aria-label="Atelier Home"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-action" />
            ATELIER
          </Link>

          <nav
            aria-label="Điều hướng chính"
            className="order-last flex w-full items-center gap-1 overflow-x-auto lg:order-none lg:w-auto lg:gap-2"
          >
            {navLinks.map((link) => {
              const isActive = normalizedPath === link.path;
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-action text-action-foreground font-semibold shadow-2xs"
                      : "text-muted hover:text-foreground hover:bg-surface-muted/80"
                  }`}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="capitalize leading-none">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {user ? (
              <AccountMenu
                user={user}
                onSignOut={() => logout()}
                isSigningOut={isSigningOut}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="rounded-full px-3 py-2 text-xs font-medium text-muted hover:bg-surface-muted sm:text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-action px-3 py-2 text-xs font-medium text-action-foreground hover:bg-action-hover sm:text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
