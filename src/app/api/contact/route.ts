import { NextRequest, NextResponse } from "next/server";
import { isContactEmailConfigured } from "@/lib/contact/config";
import { sendContactMessage } from "@/lib/contact/send-message";

interface ContactRequestBody {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  if (!isContactEmailConfigured()) {
    return NextResponse.json(
      { error: "Contact form is not configured yet" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as ContactRequestBody;

    if (body.company?.trim()) {
      return NextResponse.json({ success: true });
    }

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message must be 4,000 characters or fewer" },
        { status: 400 }
      );
    }

    await sendContactMessage({ name, email, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
