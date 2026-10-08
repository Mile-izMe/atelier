"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/src/features/auth";
import type { AuthMode } from "@/src/features/auth/components/AuthModal";

export default function AuthenticationContent() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");

  return (
    <main className="min-h-[50vh]">
      <AuthModal
        isOpen
        mode={mode}
        onModeChange={setMode}
        onClose={() => router.replace("/")}
      />
    </main>
  );
}
