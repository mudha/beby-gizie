import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getUserFromRequest } from "@/lib/jwt";
import { updateProductSchema } from "@/lib/validations";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  noStore();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  
  const { id } = await params;
  const product = await prisma.product.findUnique({ 
    where: { id },
    include: { prices: true }
  });
  
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }
  
  const { id } = await params;
  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, isActive, prices } = parsed.data;

  try {
    const product = await prisma.product.update({ 
      where: { id }, 
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(prices && {
          prices: {
            upsert: prices.map(p => ({
              where: { 
                productId_salesMethodId: { 
                  productId: id, 
                  salesMethodId: p.salesMethodId 
                } 
              },
              create: { 
                salesMethodId: p.salesMethodId, 
                price: p.price 
              },
              update: { 
                price: p.price 
              }
            }))
          }
        })
      },
      include: {
        prices: true
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }
  const { id } = await params;
  const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json(product);
}

export const dynamic = "force-dynamic";