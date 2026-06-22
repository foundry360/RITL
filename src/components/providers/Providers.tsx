import { Suspense } from "react";
import type { ProductPricingMap } from "@/lib/stripe/pricing";
import { AbandonedCheckoutRecovery } from "@/components/cart/AbandonedCheckoutRecovery";
import { ContactChatWidget } from "@/components/contact/ContactChatWidget";
import { WebsiteLeadModal } from "@/components/marketing/WebsiteLeadModal";
import { CartProvider } from "@/context/CartContext";
import { PricingProvider } from "@/context/PricingContext";

interface ProvidersProps {
  children: React.ReactNode;
  initialPricing?: ProductPricingMap;
}

export function Providers({ children, initialPricing }: ProvidersProps) {
  return (
    <PricingProvider initialPricing={initialPricing}>
      <CartProvider>
        <Suspense fallback={null}>
          <AbandonedCheckoutRecovery />
        </Suspense>
        {children}
        <WebsiteLeadModal />
        <ContactChatWidget />
      </CartProvider>
    </PricingProvider>
  );
}
