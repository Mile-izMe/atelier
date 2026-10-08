export const httpConfig = {
  // Browser requests go through the same-origin Next.js rewrite.
  baseURL:
    typeof window === "undefined"
      ? (process.env.BACKEND_URL?.replace(/\/+$/, "") ??
        "http://127.0.0.1:3001")
      : "/backend",
  timeout: 15_000,
};
