import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRegister } from "../hooks";
import type { RegisterInput } from "../types";
import { normalizeApiError } from "@/src/shared/lib/api-error";

type SignUpFields = RegisterInput & { confirmPassword: string };

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-foreground focus:outline-none sm:text-sm";

function SignUpForm({ onSuccess }: { onSuccess?: (email: string) => void }) {
  const { mutateAsync: registerAccount, isPending } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFields>({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submit = async (input: SignUpFields) => {
    try {
      const user = await registerAccount({
        email: input.email,
        username: input.username?.trim() || undefined,
        password: input.password,
      });
      onSuccess?.(user.email);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setError("root", { message: normalized.message });
      for (const detail of normalized.subErrors ?? []) {
        if (
          detail.field === "email" ||
          detail.field === "username" ||
          detail.field === "password"
        ) {
          setError(detail.field, { message: detail.message });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3.5">
      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
          {...register("email", {
            required: "Vui lòng nhập email",
            maxLength: { value: 254, message: "Email quá dài" },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email không hợp lệ",
            },
          })}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-username"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Tên đăng nhập (không bắt buộc)
        </label>
        <input
          id="signup-username"
          type="text"
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          className={inputClass}
          {...register("username", {
            validate: (value) =>
              !value?.trim() ||
              /^[A-Za-z0-9_]{3,32}$/.test(value.trim()) ||
              "Dùng 3–32 ký tự chữ, số hoặc _",
          })}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Mật khẩu
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          className={inputClass}
          {...register("password", {
            required: "Vui lòng nhập mật khẩu",
            minLength: { value: 12, message: "Mật khẩu cần ít nhất 12 ký tự" },
            maxLength: { value: 128, message: "Mật khẩu tối đa 128 ký tự" },
          })}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-confirm"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Nhập lại mật khẩu
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          className={inputClass}
          {...register("confirmPassword", {
            required: "Vui lòng nhập lại mật khẩu",
            validate: (value, values) =>
              value === values.password || "Mật khẩu không khớp",
          })}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-danger">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-full bg-action px-6 py-3.5 text-xs font-medium text-action-foreground transition hover:bg-action-hover disabled:opacity-50 sm:text-sm"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Đăng ký
      </button>
    </form>
  );
}

export default SignUpForm;
