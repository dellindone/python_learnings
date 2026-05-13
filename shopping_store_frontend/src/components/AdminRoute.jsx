import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function AdminRoute({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);

  if (!accessToken) return null;

  if (!user) {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] bg-white px-8 py-10 text-center shadow-soft">
          <p className="text-sm font-medium text-slate-500">Loading admin access...</p>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="page-shell flex min-h-[70vh] items-center justify-center">
        <div className="max-w-lg rounded-[32px] bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-danger">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-slate-500">
            This admin area is visible only to users with the admin role.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
