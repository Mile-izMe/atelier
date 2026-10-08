import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLogin } from "../hooks";
import type { LoginInput } from "../types";
import { normalizeApiError } from "@/src/shared/lib/api-error";

function SignInForm({
  onSuccess,
  initialEmail = "",
}: {
  onSuccess?: () => void;
  initialEmail?: string;
}) {
  const { mutateAsync: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    defaultValues: { email: initialEmail, password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleLogin = async (data: LoginInput) => {
    try {
      await login(data);
      onSuccess?.();
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.errorCode === "SESSION_CHANGED") return;
      form.setError("root", { message: normalized.message });
      for (const detail of normalized.subErrors ?? []) {
        if (detail.field === "email" || detail.field === "password") {
          form.setError(detail.field, { message: detail.message });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-3.5">
      <div>
        <label
          htmlFor="signin-email"
          className="block text-xs font-medium text-muted mb-1"
        >
          Email
        </label>
        <div className="relative">
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email", {
              required: "Vui lòng nhập email",
              maxLength: { value: 254, message: "Email quá dài" },
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Email không hợp lệ",
              },
            })}
            placeholder="name@domain.com"
            className="w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <Mail className="w-4 h-4 text-subtle absolute right-3.5 top-3" />
        </div>
        {errors.email && (
          <p className="text-danger text-[9px] uppercase font-black tracking-widest mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="signin-password"
            className="block text-xs font-medium text-muted"
          >
            Mật khẩu
          </label>
        </div>
        <div className="relative">
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              maxLength: { value: 128, message: "Mật khẩu tối đa 128 ký tự" },
            })}
            placeholder="••••••••"
            className="w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <Lock className="w-4 h-4 text-subtle absolute right-3.5 top-3" />
        </div>
        {errors.password && (
          <p className="text-danger text-[9px] uppercase font-black tracking-widest mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.message}
        </p>
      )}

      {/* Submit CTA */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-6 rounded-full bg-action text-action-foreground text-xs sm:text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SignInForm;
