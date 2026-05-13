import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KeyRound, UserRound } from "lucide-react";
import { updateCurrentUser } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getErrorMessage } from "../lib/utils";

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update profile"));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (nextPassword) => updateCurrentUser({ password: nextPassword }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setPassword("");
      toast.success("Password updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update password"));
    },
  });

  function handleProfileSubmit(event) {
    event.preventDefault();
    profileMutation.mutate(profileForm);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    passwordMutation.mutate(password);
  }

  return (
    <div className="page-shell grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] bg-white p-8 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">My profile</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Update your details</h1>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleProfileSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
            <Input
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <Button type="submit" size="lg" disabled={profileMutation.isPending}>
            {profileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </section>

      <section className="rounded-[32px] bg-white p-8 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Security</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Change password</h2>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handlePasswordSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">New Password</span>
            <Input
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <Button type="submit" size="lg" variant="secondary" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
