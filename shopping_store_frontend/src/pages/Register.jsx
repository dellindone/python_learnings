import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LockKeyhole, Mail, ShoppingBag, UserRound } from "lucide-react";
import { registerUser } from "../api/authApi";
import { getCurrentUser } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getErrorMessage } from "../lib/utils";

export default function Register() {
  const navigate = useNavigate();
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const tokens = await registerUser(payload);
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
      toast.success("Account created successfully");
      navigate("/");
    },
    onError: (error) => {
      useAuthStore.getState().clearAuth();
      toast.error(getErrorMessage(error, "Registration failed"));
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    registerMutation.mutate(form);
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Join in</p>
              <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <UserRound className="h-4 w-4 text-primary" />
                Full Name
              </span>
              <Input
                name="name"
                placeholder="Aditya"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

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
                minLength={8}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary transition hover:text-indigo-500">
              Login
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden rounded-l-[48px] bg-slate-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.35),transparent_32%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_100%)]" />
        <div className="relative flex h-full flex-col justify-center p-14 text-white">
          <p className="text-sm uppercase tracking-[0.45em] text-indigo-200">Why Shopping Store</p>
          <h2 className="mt-5 max-w-xl text-5xl font-extrabold leading-tight">
            Build an account once, then shop, track, and manage with confidence.
          </h2>
          <div className="mt-10 grid gap-4">
            {[
              "Responsive product discovery across mobile and desktop",
              "JWT-based auth with transparent token refresh",
              "Admin workflows for categories, products, pricing, and stock",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-slate-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
