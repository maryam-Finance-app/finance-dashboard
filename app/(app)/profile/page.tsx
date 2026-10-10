"use client";

import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  X,
} from "lucide-react";

import { createClient } from "@/lib/client";
import {
  changePasswordSchema,
  usernameSchema,
  type ChangePasswordValues,
  type UsernameValues,
} from "@/lib/validators/profile";
import {
  PROFILE_QUERY_KEY,
  useProfile,
  type Profile,
} from "@/hooks/userProfile";
import { useAuthUser } from "@/hooks/useAuthUser";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                    */
/* ------------------------------------------------------------------ */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-600">
      {message}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
      {message}
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </div>
  );
}

const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        className="pr-10"
        {...props}
      />

      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Username section                                                    */
/* ------------------------------------------------------------------ */

function UsernameSection({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: profile.username ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ username }: UsernameValues) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      // RLS only allows updating your own profile row
      const { data, error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id)
        .select("id, username, image")
        .maybeSingle();

      if (error) throw error;

      // 0 rows updated: there is no profile row for this user (or RLS blocked it)
      if (!data) throw new Error("Profile not found for this account.");

      return data as Profile;
    },
    onSuccess: (updated) => {
      // Updates the sidebar instantly too (it reads the same query)
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated);
      setEditing(false);
      setSuccess(true);
    },
  });

  const open = () => {
    reset({ username: profile.username ?? "" });
    mutation.reset();
    setSuccess(false);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    mutation.reset();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Username</h3>
          <p className="mt-1 text-sm text-slate-500">
            This is the name shown across your dashboard.
          </p>
        </div>

        {!editing && (
          <Button variant="outline" onClick={open}>
            Change Username
          </Button>
        )}
      </div>

      {!editing && success && <SuccessBox message="Username updated." />}

      {editing && (
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5"
        >
          <div className="space-y-2">
            <Label htmlFor="username">New username</Label>
            <Input
              id="username"
              placeholder="Enter a new username"
              autoComplete="username"
              aria-invalid={!!errors.username}
              disabled={mutation.isPending}
              {...register("username")}
            />
            <FieldError message={errors.username?.message} />
          </div>

          {mutation.error && <ErrorBox message={mutation.error.message} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={cancel}
              disabled={mutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button type="submit" disabled={mutation.isPending}>
              <Check className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save Username"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Password section                                                    */
/* ------------------------------------------------------------------ */

function PasswordSection() {
  const [changing, setChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: ChangePasswordValues) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("You are not logged in.");

      // updateUser() does not check the old password, so verify it first
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error("Your current password is incorrect.");

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      setChanging(false);
      setSuccess(true);
    },
  });

  const open = () => {
    reset();
    mutation.reset();
    setSuccess(false);
    setChanging(true);
  };

  const cancel = () => {
    reset();
    mutation.reset();
    setChanging(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Password</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update your password to keep your account secure.
          </p>
        </div>

        {!changing && (
          <Button variant="outline" onClick={open}>
            Change Password
          </Button>
        )}
      </div>

      {!changing && success && (
        <SuccessBox message="Password updated successfully." />
      )}

      {changing && (
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5"
        >
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              placeholder="Enter your current password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              disabled={mutation.isPending}
              {...register("currentPassword")}
            />
            <FieldError message={errors.currentPassword?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              placeholder="Enter a new password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              disabled={mutation.isPending}
              {...register("newPassword")}
            />
            {errors.newPassword ? (
              <FieldError message={errors.newPassword.message} />
            ) : (
              <p className="text-xs text-slate-400">Use at least 8 characters.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              disabled={mutation.isPending}
              {...register("confirmPassword")}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>

          {mutation.error && <ErrorBox message={mutation.error.message} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={cancel}
              disabled={mutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button type="submit" disabled={mutation.isPending}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: user } = useAuthUser();

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Spinner className="size-8 text-slate-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="text-center text-sm text-slate-500">
        Could not load your profile. Please refresh the page.
      </p>
    );
  }

  const username = profile.username ?? "User";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your account and security settings.
        </p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={profile.image ?? undefined} alt={username} />

              <AvatarFallback className="bg-slate-900 text-lg font-semibold uppercase text-white">
                {username[0]}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {username}
              </h2>

              <p className="text-sm text-slate-500">Personal Finance Account</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Account Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your basic account details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <UserRound className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Username
                  </span>
                </div>

                <p className="font-medium text-slate-900">{username}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Email
                  </span>
                </div>

                <p className="truncate font-medium text-slate-900">
                  {user?.email ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-slate-100" />

          <UsernameSection profile={profile} />

          <div className="my-8 h-px bg-slate-100" />

          <PasswordSection />
        </CardContent>
      </Card>
    </div>
  );
}