"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClient } from "@/lib/client";
import {
  loginSchema,
  signupSchema,
  type LoginValues,
  type SignupValues,
} from "@/lib/validators/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* One reusable Controller + Field block, so the forms stay short */
function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  onValueChange,
  children,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  onValueChange?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldTitle>{label}</FieldTitle>

          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            disabled={disabled}
            onChange={(e) => {
              field.onChange(e);
              onValueChange?.();
            }}
          />

          {fieldState.invalid && (
            <FieldError
              errors={[fieldState.error]}
              className="text-red-600"
            />
          )}

          {children}
        </Field>
      )}
    />
  );
}

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submitForm(data: LoginValues) {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submitForm)} noValidate>
      <FieldGroup>
        <TextField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          disabled={isSubmitting}
        />

        <TextField
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        {errors.root?.message && (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const supabase = createClient();
  const [emailSent, setEmailSent] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  async function submitForm(data: SignupValues) {
    setEmailSent(false);
    setAccountExists(false);

    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // read by the handle_new_user trigger to fill profiles.username
        data: { username: data.username },
      },
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    if (result.user && result.user.identities?.length === 0) {
      setAccountExists(true);
      setError("email", {
        message: "You already have an account with this email.",
      });
      return;
    }

    setEmailSent(true);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submitForm)} noValidate>
      <FieldGroup>
        <TextField
          control={control}
          name="username"
          label="Username"
          placeholder="Enter your username"
          autoComplete="username"
          disabled={isSubmitting}
        />

        <TextField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          disabled={isSubmitting}
          onValueChange={() => setAccountExists(false)}
        >
          {accountExists && (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-fit text-sm underline underline-offset-4"
            >
              Log in instead
            </button>
          )}
        </TextField>

        <TextField
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        {errors.root?.message && (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        )}

        {emailSent && (
          <p className="text-sm text-green-600">
            Check your email to confirm your account before logging in.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign up"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showCallbackError, setShowCallbackError] = useState(
    searchParams.get("error") === "auth_callback_failed"
  );

  const isLogin = mode === "login";

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setShowCallbackError(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isLogin ? "Login" : "SignUp"}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4">
          {showCallbackError && (
            <p className="text-sm text-red-600">
              The confirmation link is invalid or expired. Please try again.
            </p>
          )}

          {isLogin ? (
            <LoginForm key="login" />
          ) : (
            <SignupForm
              key="signup"
              onSwitchToLogin={() => switchMode("login")}
            />
          )}

          <button
            type="button"
            onClick={() => switchMode(isLogin ? "signup" : "login")}
            className="mx-auto w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {isLogin
              ? "Don't have an account? SignUp"
              : "Already have an account? Login"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}