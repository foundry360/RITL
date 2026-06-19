import { PolicyLayout } from "@/components/layout/PolicyLayout";
import { OrderLookupPanel } from "@/components/orders/OrderLookupPanel";
import { BRAND_COFFEE } from "@/lib/brand";

export const metadata = {
  title: `Track Your Order | ${BRAND_COFFEE}`,
};

export default function OrderLookupPage() {
  return (
    <PolicyLayout title="Track your order">
      <OrderLookupPanel />
    </PolicyLayout>
  );
}
