"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <Logo height={28} className="mx-auto" />
        <p className="mt-6 text-xs tracking-[0.18em] uppercase text-text-muted">
          Order Management System
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[8px] border border-graphite bg-soft-black/40 p-8"
      >
        <h1 className="text-2xl font-light tracking-tight text-text-primary">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          <BrandName /> team access for order tracking.
        </p>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.14em] uppercase text-text-muted">
              Email
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[8px] border border-graphite bg-near-black px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.14em] uppercase text-text-muted">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[8px] border border-graphite bg-near-black px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/50"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-5 text-sm text-red-300">{error}</p>
        ) : null}

        <Button
          type="submit"
          className="mt-8 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
