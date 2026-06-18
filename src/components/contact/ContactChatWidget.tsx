"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          company: honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setStatus("error");
      setErrorMessage(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send message"
      );
    }
  }

  function handleToggle() {
    setIsOpen((current) => !current);
    if (isOpen) {
      setStatus("idle");
      setErrorMessage(null);
    }
  }

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div
          ref={panelRef}
          id="contact-chat-panel"
          role="dialog"
          aria-labelledby="contact-chat-title"
          aria-modal="false"
          className="w-[min(100vw-2.5rem,22rem)] overflow-hidden rounded-[8px] border border-graphite bg-soft-black shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          <div className="border-b border-graphite px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Logo height={24} href="" />
                <h2
                  id="contact-chat-title"
                  className="mt-3 text-base font-light text-text-primary"
                >
                  Send us a message
                </h2>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                aria-label="Close chat"
                className="rounded-[8px] border border-transparent p-1 text-text-muted transition-colors hover:border-graphite hover:text-text-primary"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Questions about products, orders, or subscriptions?
            </p>
          </div>

          {status === "success" ? (
            <div className="space-y-4 px-5 py-6">
              <p className="text-sm leading-relaxed text-text-secondary">
                Thanks for reaching out. Your message has been sent and our team
                will reply soon.
              </p>
              <Button
                type="button"
                size="md"
                className="w-full"
                onClick={handleToggle}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-company">Company</label>
                <input
                  id="contact-company"
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

              <div className="space-y-2">
                <label
                  htmlFor={messageId}
                  className="block text-[10px] tracking-[0.14em] uppercase text-text-muted"
                >
                  Message
                </label>
                <textarea
                  id={messageId}
                  required
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full resize-none rounded-[8px] border border-graphite bg-near-black px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/50"
                  placeholder="How can we help?"
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-text-secondary">{errorMessage}</p>
              )}

              <Button
                type="submit"
                size="md"
                className="w-full"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls="contact-chat-panel"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border border-graphite bg-soft-black text-text-primary shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all hover:border-steel-silver/50 hover:bg-elevated",
          isOpen && "border-steel-silver/50"
        )}
      >
        {isOpen ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M4 6.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 16 6.5v5.25A2.5 2.5 0 0 1 13.5 14H9.7L5.5 16.5V14H6.5A2.5 2.5 0 0 1 4 11.5V6.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
