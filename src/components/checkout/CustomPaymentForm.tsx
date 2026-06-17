"use client";

import { useState } from "react";
import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button, ButtonLink } from "@/components/ui/Button";
import { paymentElementOptions, addressElementOptions } from "@/lib/stripe/payment-methods";

interface CustomPaymentFormProps {
  cancelHref?: string;
  customerId: string;
  clientSecret: string;
  mode: "payment" | "subscription";
  email: string;
}

export function CustomPaymentForm({
  cancelHref = "/cart",
  customerId,
  clientSecret,
  mode,
  email,
}: CustomPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const addressElement = elements.getElement(AddressElement);
      if (!addressElement) {
        setErrorMessage("Shipping address could not be loaded.");
        setIsSubmitting(false);
        return;
      }

      const { complete, value: addressValue } = await addressElement.getValue();
      if (!complete) {
        setErrorMessage("Please complete your shipping address.");
        setIsSubmitting(false);
        return;
      }

      const trimmedEmail = email.trim();
      const shippingAddress = {
        line1: addressValue.address.line1,
        line2: addressValue.address.line2 ?? undefined,
        city: addressValue.address.city,
        state: addressValue.address.state,
        postal_code: addressValue.address.postal_code,
        country: addressValue.address.country,
      };

      const customerResponse = await fetch("/api/checkout/customer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          clientSecret,
          mode,
          email: trimmedEmail,
          name: addressValue.name,
          phone: addressValue.phone,
          address: shippingAddress,
        }),
      });

      if (!customerResponse.ok) {
        const customerData = await customerResponse.json();
        throw new Error(customerData.error || "Failed to save customer details.");
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: trimmedEmail,
          shipping: {
            name: addressValue.name,
            phone: addressValue.phone,
            address: shippingAddress,
          },
          payment_method_data: {
            billing_details: {
              name: addressValue.name,
              email: trimmedEmail,
              phone: addressValue.phone,
              address: shippingAddress,
            },
          },
        },
      });

      if (error) {
        setErrorMessage(error.message ?? "Payment could not be completed.");
        setIsSubmitting(false);
      }
    } catch (submitError) {
      setErrorMessage(
        submitError instanceof Error
          ? submitError.message
          : "Payment could not be completed."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[10px] tracking-[0.18em] uppercase text-text-muted">
          Shipping
        </h3>
        <p className="text-sm text-text-secondary">{email}</p>
        <AddressElement options={addressElementOptions} />
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] tracking-[0.18em] uppercase text-text-muted">
          Payment
        </h3>
        <PaymentElement options={paymentElementOptions} />
      </div>

      {errorMessage && (
        <p className="text-sm text-text-secondary">{errorMessage}</p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href={cancelHref} variant="outline" size="lg">
          Cancel
        </ButtonLink>
        <Button type="submit" size="lg" disabled={!stripe || isSubmitting}>
          {isSubmitting ? "Processing..." : "Complete Payment"}
        </Button>
      </div>
    </form>
  );
}
