// NextAuth has been replaced with Supabase Auth.
// This file is kept as a no-op to avoid 404s on any old callbacks.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}

export async function POST() {
  return NextResponse.json({ message: "Auth handled by Supabase" }, { status: 200 });
}
