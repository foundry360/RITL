export interface CachedCheckoutState {
  clientSecret: string;
  mode: "payment" | "subscription";
  customerId: string;
  email: string;
  promoCode?: string;
}

const CHECKOUT_REF_PREFIX = "ritl-checkout-ref:";
const CHECKOUT_STATE_PREFIX = "ritl-checkout-state:";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCheckoutItemsKey(
  items: Array<{
    productId: string;
    quantity: number;
    purchaseType?: string;
  }>
): string {
  return JSON.stringify(
    [...items]
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        purchaseType: item.purchaseType ?? "one-time",
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId))
  );
}

export function getCheckoutSessionKey(
  itemsKey: string,
  promoCode?: string
): string {
  const normalizedPromo = promoCode?.trim().toUpperCase();
  return normalizedPromo ? `${itemsKey}::promo:${normalizedPromo}` : itemsKey;
}

export function getCheckoutReference(sessionKey: string): string {
  if (!isBrowser()) {
    return "";
  }

  const storageKey = `${CHECKOUT_REF_PREFIX}${sessionKey}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const reference = crypto.randomUUID();
  sessionStorage.setItem(storageKey, reference);
  return reference;
}

export function readCachedCheckout(
  sessionKey: string
): CachedCheckoutState | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = sessionStorage.getItem(`${CHECKOUT_STATE_PREFIX}${sessionKey}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CachedCheckoutState;
  } catch {
    return null;
  }
}

export function writeCachedCheckout(
  sessionKey: string,
  state: CachedCheckoutState
): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(
    `${CHECKOUT_STATE_PREFIX}${sessionKey}`,
    JSON.stringify(state)
  );
}

export function clearCheckoutSession(): void {
  if (!isBrowser()) {
    return;
  }

  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (
      key?.startsWith(CHECKOUT_REF_PREFIX) ||
      key?.startsWith(CHECKOUT_STATE_PREFIX)
    ) {
      sessionStorage.removeItem(key);
    }
  }
}
