import { NextResponse } from "next/server";
import { getSalesforceOrganization } from "@/lib/salesforce/client";
import { getSalesforceSession } from "@/lib/salesforce/auth";
import {
  getSalesforceApiVersion,
  getSalesforceStripeCustomerField,
  isSalesforceConfigured,
} from "@/lib/salesforce/config";

export async function GET() {
  if (!isSalesforceConfigured()) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message:
        "Salesforce is not configured. Run npm run salesforce:authorize after creating a Connected App.",
    });
  }

  try {
    const session = await getSalesforceSession();
    const organization = await getSalesforceOrganization();

    return NextResponse.json({
      connected: true,
      configured: true,
      instanceUrl: session.instanceUrl,
      apiVersion: getSalesforceApiVersion(),
      organization,
      stripeCustomerField: getSalesforceStripeCustomerField() ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify Salesforce connection";
    return NextResponse.json(
      {
        connected: false,
        configured: true,
        error: message,
      },
      { status: 500 }
    );
  }
}
