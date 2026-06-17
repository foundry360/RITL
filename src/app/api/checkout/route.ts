import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import {
  getProduct,
  getStripePriceId,
  type ProductId,
} from "@/lib/stripe/products";

interface CheckoutItem {
  productId: ProductId;
  quantity: number;
}

function normalizeCheckoutItems(body: {
  productId?: ProductId;
  items?: CheckoutItem[];
}): CheckoutItem[] | null {
  if (body.items?.length) {
    return body.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(99, Math.floor(item.quantity)),
      }));
  }

  if (body.productId) {
    return [{ productId: body.productId, quantity: 1 }];
  }

  return null;
}

function buildLineItems(items: CheckoutItem[]) {
  return items.map((item) => {
    const product = getProduct(item.productId);
    if (!product) {
      throw new Error(`Invalid product: ${item.productId}`);
    }

    const priceId = getStripePriceId(item.productId);

    if (priceId) {
      return { price: priceId, quantity: item.quantity };
    }

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.price * 100,
      },
      quantity: item.quantity,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const checkoutItems = normalizeCheckoutItems(body);

    if (!checkoutItems?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    for (const item of checkoutItems) {
      if (!getProduct(item.productId)) {
        return NextResponse.json({ error: "Invalid product" }, { status: 400 });
      }
    }

    const stripe = getStripe();
    const origin =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      line_items: buildLineItems(checkoutItems),
      mode: "payment",
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: { enabled: false },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Checkout session error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
