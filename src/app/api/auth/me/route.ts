import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";

import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export const dynamic = "force-dynamic";
