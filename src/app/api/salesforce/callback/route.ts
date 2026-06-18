import { NextRequest, NextResponse } from "next/server";
import { exchangeSalesforceAuthorizationCode } from "@/lib/salesforce/auth";
import { getSalesforceClientId } from "@/lib/salesforce/config";

function getRedirectUri(request: NextRequest): string {
  const configured = process.env.SALESFORCE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  return `${request.nextUrl.origin}/api/salesforce/callback`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const redirectUri = getRedirectUri(request);

  if (error) {
    return NextResponse.json(
      { error: `Salesforce authorization failed: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        error: "Missing authorization code",
        redirectUri,
        hint: "Run npm run salesforce:authorize or open the Salesforce authorize URL.",
      },
      { status: 400 }
    );
  }

  if (
    !process.env.SALESFORCE_CLIENT_ID?.trim() ||
    !process.env.SALESFORCE_CLIENT_SECRET?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET before completing OAuth.",
      },
      { status: 503 }
    );
  }

  try {
    const token = await exchangeSalesforceAuthorizationCode(code, redirectUri);

    return NextResponse.json({
      success: true,
      instanceUrl: token.instance_url,
      clientId: getSalesforceClientId(),
      refreshToken: token.refresh_token,
      message:
        "Add SALESFORCE_REFRESH_TOKEN and SALESFORCE_INSTANCE_URL to .env.local, then run npm run salesforce:verify.",
      env: {
        SALESFORCE_INSTANCE_URL: token.instance_url,
        SALESFORCE_REFRESH_TOKEN: token.refresh_token,
      },
    });
  } catch (exchangeError) {
    const message =
      exchangeError instanceof Error
        ? exchangeError.message
        : "Failed to exchange Salesforce authorization code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
