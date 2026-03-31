import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getUserFromRequest } from "@/lib/jwt";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const branchId = searchParams.get("branchId");
  const salesMethod = searchParams.get("salesMethod");

  const where: Record<string, unknown> = {};
  if (branchId) where.branchId = branchId;
  if (salesMethod) where.salesMethod = salesMethod;
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: new Date(startDate + "T00:00:00") } : {}),
      ...(endDate ? { lte: new Date(endDate + "T23:59:59") } : {}),
    };
  }

  const [totalResult, transactionCount, branchStats, methodStats, topProducts, recentTransactions] =
    await Promise.all([
      // Total penjualan
      prisma.transaction.aggregate({ where, _sum: { totalAmount: true } }),
      // Jumlah transaksi
      prisma.transaction.count({ where }),
      // Per cabang
      prisma.transaction.groupBy({
        by: ["branchId"],
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Per metode
      prisma.transaction.groupBy({
        by: ["salesMethod"],
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Produk terlaris
      prisma.transactionItem.groupBy({
        by: ["productNameSnapshot"],
        where: { transaction: where },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      // Transaksi terbaru
      prisma.transaction.findMany({
        where,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          branch: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

  // Ambil nama cabang untuk statistik
  const branches = await prisma.branch.findMany();
  const branchMap = new Map(branches.map((b: any) => [b.id, b.name]));

  const totalAmount = totalResult._sum.totalAmount ?? 0;
  const avgPerTransaction = transactionCount > 0 ? Math.round(totalAmount / transactionCount) : 0;

  return NextResponse.json({
    summary: {
      totalAmount,
      transactionCount,
      avgPerTransaction,
    },
    branchStats: branchStats.map((s: any) => ({
      branchId: s.branchId,
      branchName: branchMap.get(s.branchId) ?? s.branchId,
      totalAmount: s._sum.totalAmount ?? 0,
      count: s._count,
    })),
    methodStats: methodStats.map((s: any) => ({
      method: s.salesMethod,
      totalAmount: s._sum.totalAmount ?? 0,
      count: s._count,
    })),
    topProducts: topProducts.map((p: any) => ({
      name: p.productNameSnapshot,
      totalQty: p._sum.quantity ?? 0,
      totalAmount: p._sum.subtotal ?? 0,
    })),
    recentTransactions,
  });
}

export const dynamic = "force-dynamic";


