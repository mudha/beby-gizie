import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashSync } from "bcryptjs";

export async function GET() {
  try {
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        name: "Administrator",
        username: "admin",
        passwordHash: hashSync("admin123", 10),
        role: "ADMIN",
        branchId: null,
      },
    });
    return NextResponse.json({ message: "Admin berhasil dibuat!", admin: admin.username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
