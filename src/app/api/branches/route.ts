import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "true";
  
  const branches = await prisma.branch.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { name, isActive } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("[POST_BRANCH]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
