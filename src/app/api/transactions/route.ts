import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getUserFromRequest } from "@/lib/jwt";
import { createTransactionSchema, transactionFilterSchema } from "@/lib/validations";
import { generateTransactionNumber } from "@/lib/transaction-utils";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = transactionFilterSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });

  const { startDate, endDate, branchId, salesMethod, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (branchId) where.branchId = branchId;
  if (salesMethod) where.salesMethod = salesMethod;
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: new Date(startDate + "T00:00:00") } : {}),
      ...(endDate ? { lte: new Date(endDate + "T23:59:59") } : {}),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const body = await req.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { branchId, salesMethod, items } = parsed.data;

  // Cek apakah sales method valid
  const activeSalesMethod = await prisma.salesMethod.findUnique({
    where: { code: salesMethod, isActive: true }
  });

  if (!activeSalesMethod) {
    return NextResponse.json({ error: "Metode penjualan tidak valid atau belum aktif" }, { status: 400 });
  }

  // Ambil produk aktif dan harganya berdasarkan metode
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      prices: {
        where: { salesMethodId: activeSalesMethod.id }
      }
    }
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Beberapa produk tidak valid atau sudah tidak aktif" }, { status: 400 });
  }

  const productMap = new Map(products.map((p: any) => [p.id, p]));

  // Hitung items dan total
  const transactionItems = [];
  for (const item of items) {
    const product: { id: string; price: number; name: string, prices: any[] } = productMap.get(item.productId)! as any;
    
    // Dapatkan harga spesifik dari ProductPrice, fallback jika kosong (sementara)
    let finalPrice = product.price; 
    if (product.prices && product.prices.length > 0) {
      finalPrice = product.prices[0].price;
    } else {
      return NextResponse.json({ error: `Harga untuk '${product.name}' pada '${activeSalesMethod.name}' belum disetel!` }, { status: 400 });
    }

    const subtotal = finalPrice * item.quantity;
    transactionItems.push({
      productId: item.productId,
      productNameSnapshot: product.name,
      priceSnapshot: finalPrice,
      quantity: item.quantity,
      subtotal,
    });
  }

  const totalAmount = transactionItems.reduce((sum, i) => sum + i.subtotal, 0);
  const transactionNumber = await generateTransactionNumber();

  const transaction = await prisma.transaction.create({
    data: {
      transactionNumber,
      branchId,
      salesMethod,
      totalAmount,
      createdByUserId: user.id,
      items: { create: transactionItems },
    },
    include: {
      branch: { select: { name: true } },
      items: true,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
export const dynamic = "force-dynamic";


