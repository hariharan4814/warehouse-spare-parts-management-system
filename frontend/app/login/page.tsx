"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { KeyRound, User as UserIcon, Loader2, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

function LoginContent() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get("redirect") || "/";
      router.push(redirectUrl);
    }
  }, [user, router, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      await login(data.username, data.password);
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { detail?: string; error?: string } };
      };
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        "Invalid username or password. Please try again.";
      setAuthError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-radial from-neutral-50 to-neutral-200 p-4 dark:from-neutral-900 dark:to-black">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <Card className="relative z-10 w-full max-w-md border-neutral-200/80 shadow-2xl backdrop-blur-md dark:border-neutral-800">
        <CardHeader className="space-y-1.5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the spare parts system.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {authError && (
              <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <FormField label="Username" error={errors.username?.message}>
              <div className="relative">
                <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register("username")}
                  placeholder="Enter your employee username"
                  className="pl-10"
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>
            </FormField>

            <FormField label="Password" error={errors.password?.message}>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={submitting}
                  autoComplete="current-password"
                />
              </div>
            </FormField>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Authorized personnel only. Sessions are monitored and audited.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
