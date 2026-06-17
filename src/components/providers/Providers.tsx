import type { ProductPricingMap } from "@/lib/stripe/pricing";
import { CartProvider } from "@/context/CartContext";
import { PricingProvider } from "@/context/PricingContext";

interface ProvidersProps {
  children: React.ReactNode;
  initialPricing?: ProductPricingMap;
}

export function Providers({ children, initialPricing }: ProvidersProps) {
  return (
    <PricingProvider initialPricing={initialPricing}>
      <CartProvider>{children}</CartProvider>
    </PricingProvider>
  );
}
