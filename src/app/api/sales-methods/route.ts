import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { createSalesMethodSchema } from "@/lib/validations";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get("active") === "true";

  const methods = await prisma.salesMethod.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { name: "asc" },
  });

  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSalesMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const existing = await prisma.salesMethod.findUnique({
      where: { code: parsed.data.code },
    });

    if (existing) {
      return NextResponse.json({ error: "Kode metode penjualan sudah digunakan" }, { status: 400 });
    }

    const method = await prisma.salesMethod.create({ data: parsed.data });
    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error("Error creating sales method:", error);
    return NextResponse.json({ error: "Gagal membuat metode penjualan" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
