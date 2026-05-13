import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { loginUser } from "../api/authApi";
import { getCurrentUser } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getErrorMessage } from "../lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const tokens = await loginUser(payload);
      useAuthStore.getState().setTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      const user = await getCurrentUser();
      return { tokens, user };
    },
    onSuccess: ({ tokens, user }) => {
      completeLogin({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      });
      toast.success(`Welcome back, ${user.name}`);
      navigate("/");
    },
    onError: (error) => {
      useAuthStore.getState().clearAuth();
      toast.error(getErrorMessage(error, "Login failed"));
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    loginMutation.mutate(form);
  }

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.45),transparent_40%),linear-gradient(135deg,#020617_0%,#111827_50%,#312e81_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Shopping Store</p>
              <p className="text-xl font-semibold">Premium storefront experience</p>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-200">Secure Access</p>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">
              Sign in to explore a cleaner, faster way to shop.
            </h1>
            <p className="mt-6 text-lg text-slate-200">
              Browse products, manage your cart, track orders, and switch into admin mode when your role allows it.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["Curated catalog", "Smart cart flow", "Admin tools"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-950/10 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Welcome back</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Login to your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Use the credentials from your Shopping Store backend users table.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </span>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <LockKeyhole className="h-4 w-4 text-primary" />
                Password
              </span>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary transition hover:text-indigo-500">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
