import { NextRequest, NextResponse } from "next/server";
import { isGhlConfigured } from "@/lib/gohighlevel/config";
import { syncGhlMailingListSignup } from "@/lib/gohighlevel/sync-mailing-list";

interface MailingListRequestBody {
  email?: string;
  company?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  if (!isGhlConfigured()) {
    return NextResponse.json(
      { error: "Mailing list signup is not configured yet" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as MailingListRequestBody;

    if (body.company?.trim()) {
      return NextResponse.json({ success: true });
    }

    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = await syncGhlMailingListSignup(email);

    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      created: result.created,
      tag: result.tag,
    });
  } catch (error) {
    console.error("Mailing list sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to join the mailing list";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
