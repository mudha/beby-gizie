import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { hash } from "bcryptjs";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const users = await prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: { branch: true },
      orderBy: { createdAt: "asc" }
    });

    // Exclude passwordHash from response for security
    const sanitizedUsers = users.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error("[GET_USERS]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, password, role, branchId, isActive } = body;

    // Validation
    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "Nama, username, password, dan peran wajib diisi" }, { status: 400 });
    }

    if (role === "EMPLOYEE" && !branchId) {
      return NextResponse.json({ error: "Karyawan wajib ditugaskan ke sebuah cabang" }, { status: 400 });
    }

    // Check unique username
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        passwordHash: hashedPassword,
        role,
        branchId: role === "ADMIN" ? null : branchId, // Admins don't need a specific branch
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { branch: true } // Include branch in returned object to update UI properly
    });

    const { passwordHash, ...sanitizedUser } = newUser;
    return NextResponse.json(sanitizedUser, { status: 201 });
  } catch (error) {
    console.error("[POST_USER]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
