import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { updateSalesMethodSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSalesMethodSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const method = await prisma.salesMethod.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(method);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui metode penjualan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }
  
  const { id } = await params;

  try {
    await prisma.salesMethod.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Metode penjualan berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus metode penjualan" }, { status: 500 });
  }
}
