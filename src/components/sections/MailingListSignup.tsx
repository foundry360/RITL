"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

type FormStatus = "idle" | "submitting" | "success" | "error";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function MailingListSignup() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setStatus("error");
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          company: honeypot,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setStatus("success");
      setEmail("");
    } catch (submitError) {
      setStatus("error");
      setErrorMessage(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    }
  }

  if (status === "success") {
    return (
      <p className="mt-10 text-sm leading-relaxed text-text-secondary">
        You&apos;re on the list. Watch your inbox for ritual updates from RITÜL.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-lg text-left">
      <form onSubmit={handleSubmit}>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="mailing-company">Company</label>
          <input
            id="mailing-company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            aria-label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "submitting"}
            className="w-full flex-1 rounded-[8px] border border-graphite bg-near-black px-3 py-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/50 disabled:opacity-60"
            placeholder="you@example.com"
          />

          <Button
            type="submit"
            size="lg"
            className="w-full shrink-0 sm:w-auto"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Joining..." : "Join"}
          </Button>
        </div>
      </form>

      {errorMessage && (
        <p className="mt-3 text-sm text-text-secondary">{errorMessage}</p>
      )}
    </div>
  );
}
