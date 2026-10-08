"use client";

import { CheckCircle, Info, XCircle } from "lucide-react";
import { Toaster } from "sonner";

function CustomToast() {
  return (
    <Toaster
      position="bottom-right"
      duration={4000}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <XCircle className="w-5 h-5 text-rose-400" />,
        info: <Info className="w-5 h-5 text-red-500" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md w-[356px] pointer-events-auto",

          success: "bg-emerald-950/90 border-emerald-800 text-emerald-200",
          error: "bg-rose-950/90 border-rose-800 text-rose-200",
          info: "bg-zinc-900/95 border-zinc-800 text-zinc-100",
          warning: "bg-amber-950/90 border-amber-800 text-amber-200",

          title: "flex-1 text-sm font-medium pr-2",
          description: "text-xs opacity-80 mt-1",
          icon: "mt-0.5 shrink-0",

          closeButton:
            "absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 rounded-md hover:bg-white/5",
        },
      }}
    />
  );
}

export default CustomToast;
