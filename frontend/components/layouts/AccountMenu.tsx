"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShoppingBag } from "lucide-react";
import type { UserType } from "@/src/features/auth/types";

interface AccountMenuProps {
  user: UserType;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export default function AccountMenu({
  user,
  onSignOut,
  isSigningOut,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user.username?.trim() || user.username || user.email;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          id="user-account-dropdown-btn"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full p-1.5 text-foreground transition hover:bg-surface-muted sm:px-3 sm:py-1.5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-action text-[11px] font-semibold text-action-foreground">
            {initials}
          </span>
          <span className="hidden max-w-[100px] truncate text-md font-medium md:inline">
            {displayName}
          </span>
          <ChevronDown className="hidden h-3 w-3 text-subtle sm:block" />
        </button>

        {isOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-4 shadow-xl"
          >
            <div className="border-b border-line pb-3">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              id="menu-signout-btn"
              disabled={isSigningOut}
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        id="cart-drawer-toggle-btn"
        // onClick={onOpenCart}
        className="relative p-2.5 rounded-full hover:bg-surface-muted text-foreground transition cursor-pointer focus:outline-none"
        aria-label="Shopping Bag"
      >
        <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
        {/* {cartCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-action text-[10px] font-semibold text-action-foreground">
            {cartCount}
          </span>
        )} */}
      </button>
    </div>
  );
}
