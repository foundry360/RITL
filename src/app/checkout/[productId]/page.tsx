import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { SecureCheckout } from "@/components/checkout/SecureCheckout";
import { notFound } from "next/navigation";
import {
  getProduct,
  type ProductId,
  type PurchaseType,
} from "@/lib/stripe/products";
import { BRAND_COFFEE } from "@/lib/brand";

interface CheckoutPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ purchaseType?: string; quantity?: string }>;
}

function parsePurchaseType(value?: string): PurchaseType {
  return value === "subscription" ? "subscription" : "one-time";
}

function parseQuantity(value?: string): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(99, parsed);
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return { title: `Secure Checkout | ${BRAND_COFFEE}` };
  return {
    title: `Secure Checkout | ${product.name} | ${BRAND_COFFEE}`,
  };
}

export default async function ProductCheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { productId } = await params;
  const { purchaseType: purchaseTypeParam, quantity: quantityParam } =
    await searchParams;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  const purchaseType = parsePurchaseType(purchaseTypeParam);
  const quantity =
    purchaseType === "one-time" ? parseQuantity(quantityParam) : 1;
  const items = [
    { productId: product.id as ProductId, quantity, purchaseType },
  ];

  return (
    <CheckoutPageShell
      step="payment"
      backHref={`/products/${product.id}`}
      backLabel={`Back to ${product.name}`}
      title="Complete your order"
      description="Enter your shipping and payment details below. Your information is encrypted and processed securely by Stripe."
    >
      <SecureCheckout
        items={items}
        showEditLink={false}
        cancelHref={`/products/${product.id}`}
      />
    </CheckoutPageShell>
  );
}
