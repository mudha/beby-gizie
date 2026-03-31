import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/jwt";


export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ message: "Berhasil keluar" });
}

export const dynamic = "force-dynamic";
