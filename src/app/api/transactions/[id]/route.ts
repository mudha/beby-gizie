import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


import { getUserFromRequest } from "@/lib/jwt";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { name: true, username: true } },
      items: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(transaction);
}

import { createTransactionSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const { id } = await params;

    // Ambil transaksi lama
    const existingTx = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingTx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Role checking
    if (user.role !== "ADMIN") {
      if (existingTx.branchId !== user.branchId) {
        return NextResponse.json({ error: "Anda tidak berhak mengedit dari cabang lain" }, { status: 403 });
      }

      // Check "Hari Ini" limit
      const tz = "Asia/Jakarta";
      const dateString = new Date().toLocaleDateString("en-CA", { timeZone: tz });
      const startOfDay = new Date(`${dateString}T00:00:00.000+07:00`);
      const endOfDay = new Date(`${dateString}T23:59:59.999+07:00`);

      const txDate = new Date(existingTx.createdAt);
      if (txDate < startOfDay || txDate > endOfDay) {
         return NextResponse.json({ error: "Transaksi ini tidak bisa diedit karena sudah lewat hari" }, { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { branchId, salesMethod, items } = parsed.data;

    // Ambil produk aktif terkini beserta harganya
    const productIds = items.map((i) => i.productId);
    const [products, activeSalesMethod] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { prices: true }, // Perlu harga spesifik per metode
      }),
      prisma.salesMethod.findUnique({
        where: { code: salesMethod, isActive: true },
      })
    ]);

    if (!activeSalesMethod) {
      return NextResponse.json({ error: "Metode penjualan tidak valid atau tidak aktif" }, { status: 400 });
    }

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Ada produk tidak valid/nonaktif. Silakan periksa kembali." }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const transactionItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      
      let finalPrice = 0;
      const specificPrice = product.prices.find((p: any) => p.salesMethodId === activeSalesMethod.id);
      if (specificPrice) {
        finalPrice = specificPrice.price;
      } else if (product.prices && product.prices.length > 0) {
        finalPrice = product.prices[0].price; // fallback ke harga pertama
      } else {
        return NextResponse.json({ error: `Harga untuk '${product.name}' pada metode ini belum disetel!` }, { status: 400 });
      }

      transactionItems.push({
        productId: item.productId,
        productNameSnapshot: product.name,
        priceSnapshot: finalPrice,
        quantity: item.quantity,
        subtotal: finalPrice * item.quantity,
      });
    }

    const totalAmount = transactionItems.reduce((sum, i) => sum + i.subtotal, 0);

    const updatedTx = await prisma.transaction.update({
      where: { id },
      data: {
        branchId,
        salesMethod,
        totalAmount,
        items: {
          deleteMany: {},
          create: transactionItems,
        },
      },
      include: {
        branch: { select: { name: true } },
        items: true,
      },
    });

    return NextResponse.json(updatedTx, { status: 200 });

  } catch (error) {
    console.error("[EDIT_TRANSACTION]", error);
    return NextResponse.json({ error: "Gagal menyimpan perubahan" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

    const { id } = await params;

    const existingTx = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Transaksi berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_TRANSACTION]", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";