export function CheckoutTrustBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-graphite bg-soft-black/60 px-5 py-4">
      <div className="flex items-center gap-2 text-text-secondary">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect
            x="4"
            y="9"
            width="12"
            height="8"
            rx="1"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M7 9V6a3 3 0 0 1 6 0v3"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[10px] tracking-[0.14em] uppercase">
          SSL Encrypted
        </span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 3 4 6v4c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V6l-6-3z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path
            d="M8 10l1.5 1.5L12 9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[10px] tracking-[0.14em] uppercase">
          Secure Checkout
        </span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
          Payments by
        </span>
        <span className="text-xs font-medium tracking-wide text-text-primary">
          Stripe
        </span>
      </div>
    </div>
  );
}
