"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ritul-website-lead-modal";
const SHOW_DELAY_MS = 4000;
const LEAD_MODAL_IMAGE = "/marketing/focus-coffee-lead-modal.png";
const MODAL_ACCENT_CLASS = "text-[#B96824]";
const MODAL_ACCENT_BUTTON_CLASS =
  "border-[#B96824]/60 bg-[#B96824]/15 text-text-primary hover:border-[#B96824] hover:bg-[#B96824]/25";

type FormStatus = "idle" | "submitting" | "success" | "error";
type DismissReason = "dismissed" | "submitted";

function isHomepage(pathname: string | null): boolean {
  return pathname === "/";
}

function readDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function persistDismiss(reason: DismissReason): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, reason);
  } catch {
    // Ignore storage failures — modal may reappear on next session.
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function WebsiteLeadModal() {
  const pathname = usePathname();
  const nameId = useId();
  const emailId = useId();
  const titleId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isExcludedRoute =
    !isHomepage(pathname) ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dev");

  useEffect(() => {
    if (isExcludedRoute) {
      setIsVisible(false);
      return;
    }

    if (readDismissed()) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [isExcludedRoute, pathname]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  function closeModal(reason: DismissReason) {
    persistDismiss(reason);
    setIsVisible(false);
  }

  function handleDismiss() {
    closeModal("dismissed");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setStatus("error");
      setErrorMessage("Please enter your name and email.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          company: honeypot,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setStatus("success");
      window.setTimeout(() => closeModal("submitted"), 1200);
    } catch (submitError) {
      setStatus("error");
      setErrorMessage(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    }
  }

  if (!isVisible || isExcludedRoute) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 sm:px-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative grid w-full max-w-4xl overflow-hidden rounded-[8px] border border-graphite bg-soft-black",
          "grid-cols-1 sm:grid-cols-2",
          "shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        )}
      >
        <div className="relative min-h-[220px] bg-near-black sm:min-h-[min(72vh,520px)]">
          <Image
            src={LEAD_MODAL_IMAGE}
            alt="RITÜL Focus Coffee — no crash, no jitters, just focus"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center border-t border-graphite bg-soft-black sm:border-t-0 sm:border-l">
          {status === "success" ? (
            <div className="space-y-3 px-6 py-8 sm:px-8">
              <Logo height={24} href="" />
              <h2
                id={titleId}
                className="text-2xl font-light tracking-tight text-text-primary"
              >
                Welcome to the ritual
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Check your inbox for{" "}
                <span className={MODAL_ACCENT_CLASS}>10% off</span> your first
                order.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-8 sm:px-8">
              <Logo height={24} href="" />
              <div>
                <p className={cn("text-[10px] tracking-[0.2em] uppercase", MODAL_ACCENT_CLASS)}>
                  10% Off Your First Order
                </p>
                <h2
                  id={titleId}
                  className="mt-3 text-2xl font-light tracking-tight text-text-primary sm:text-[1.65rem]"
                >
                  <span className="block">No Crash.</span>
                  <span className="block">No Jitters.</span>
                  <span className={cn("block", MODAL_ACCENT_CLASS)}>Just Focus.</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  Join and get 10% off your first order.
                </p>
              </div>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="lead-company">Company</label>
                <input
                  id="lead-company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={nameId}
                  className="block text-[10px] tracking-[0.14em] uppercase text-text-muted"
                >
                  Name
                </label>
                <input
                  id={nameId}
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-[8px] border border-graphite bg-near-black px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/50"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={emailId}
                  className="block text-[10px] tracking-[0.14em] uppercase text-text-muted"
                >
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[8px] border border-graphite bg-near-black px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/50"
                  placeholder="you@example.com"
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-text-secondary">{errorMessage}</p>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  size="md"
                  className={cn("w-full", MODAL_ACCENT_BUTTON_CLASS)}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Submitting..." : "Get 10% Off"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="w-full"
                  disabled={status === "submitting"}
                  onClick={handleDismiss}
                >
                  No Thanks
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
