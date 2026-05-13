import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, ShoppingCart, User, LogOut, Package2, Shield } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCart } from "../api/cartApi";
import { logoutUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { Button } from "./ui/button";
import { getErrorMessage } from "../lib/utils";

const navClassName = ({ isActive }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
  ].join(" ");

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cartCount = useCartStore((state) => state.cartCount);
  const setCartCount = useCartStore((state) => state.setCartCount);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  useEffect(() => {
    if (cartQuery.data?.items) {
      const nextCount = cartQuery.data.items.reduce(
        (total, item) => total + Number(item.quantity ?? 0),
        0,
      );
      setCartCount(nextCount);
    }
  }, [cartQuery.data, setCartCount]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const initials = useMemo(
    () =>
      user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "SS",
    [user?.name],
  );

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not log out cleanly"));
    },
    onSettled: () => {
      clearAuth();
      setCartCount(0);
      queryClient.clear();
      navigate("/login");
    },
  });

  const links = [
    { to: "/", label: "Home" },
    { to: "/orders", label: "Orders" },
    { to: "/cart", label: "Cart" },
  ];

  if (role === "admin") {
    links.push({ to: "/admin/products", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Shopping Store</p>
            <p className="text-sm font-semibold text-white">Curated everyday essentials</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClassName}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold">
              {cartCount}
            </span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-left text-white transition hover:bg-white/15"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{user?.name || "My Account"}</p>
                <p className="text-xs text-slate-300">{user?.email}</p>
              </div>
            </button>

            {dropdownOpen ? (
              <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                {role === "admin" ? (
                  <Link
                    to="/admin/categories"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Shield className="h-4 w-4" />
                    Categories
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-danger transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-ink"
                      : "bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                {link.label === "Admin" ? <Package2 className="h-4 w-4" /> : null}
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/profile"
              className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className="rounded-2xl bg-red-500/10 px-4 py-3 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
