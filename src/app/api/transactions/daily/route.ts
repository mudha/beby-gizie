import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") || user.branchId;

  if (!branchId) {
    return NextResponse.json({ error: "Cabang tidak ditentukan" }, { status: 400 });
  }

  // Jika EMPLOYEE, hanya boleh ngecek cabangnya sendiri
  if (user.role !== "ADMIN" && branchId !== user.branchId) {
    return NextResponse.json({ error: "Anda tidak berhak melihat cabang ini" }, { status: 403 });
  }

  // Waktu Mulai & Berakhir Hari Ini (WIB / Asia/Jakarta)
  const tz = "Asia/Jakarta";
  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // => YYYY-MM-DD
  const startOfDay = new Date(`${dateString}T00:00:00.000+07:00`);
  const endOfDay = new Date(`${dateString}T23:59:59.999+07:00`);

  const where = {
    branchId,
    createdAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  try {
    const [transactions, totalAmount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
    ]);

    return NextResponse.json({
      totalTransactions: transactions.length,
      totalAmount: totalAmount._sum.totalAmount || 0,
      transactions,
    });
  } catch (error) {
    console.error("[DAILY_STATS]", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan harian" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
