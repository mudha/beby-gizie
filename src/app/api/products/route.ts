import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getUserFromRequest } from "@/lib/jwt";
import { createProductSchema } from "@/lib/validations";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get("active") === "true";

  const products = await prisma.product.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { name: "asc" },
    include: {
      prices: true,
    },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, isActive, prices } = parsed.data;

  try {
    const product = await prisma.product.create({ 
      data: {
        name,
        isActive,
        prices: {
          create: prices.map(p => ({
            salesMethodId: p.salesMethodId,
            price: p.price
          }))
        }
      },
      include: {
        prices: true
      }
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
