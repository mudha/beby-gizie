import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/jwt";
import { hash } from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, password, role, branchId, isActive } = body;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Checking if trying to change to an existing username
    if (username && username !== existingUser.username) {
      const isTaken = await prisma.user.findUnique({ where: { username } });
      if (isTaken) {
         return NextResponse.json({ error: "Username sudah digunakan orang lain" }, { status: 400 });
      }
    }

    // Role specific validation
    const targetRole = role || existingUser.role;
    const targetBranch = branchId !== undefined ? branchId : existingUser.branchId;
    
    if (targetRole === "EMPLOYEE" && !targetBranch) {
       return NextResponse.json({ error: "Karyawan wajib ditugaskan ke sebuah cabang" }, { status: 400 });
    }

    const updateData: any = {
      ...(name && { name: name.trim() }),
      ...(username && { username: username.trim() }),
      ...(role && { role }),
      branchId: targetRole === "ADMIN" ? null : targetBranch,
      ...(isActive !== undefined && { isActive }),
    };

    if (password && password.trim() !== "") {
      updateData.passwordHash = await hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { branch: true }
    });

    const { passwordHash, ...sanitized } = updated;
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("[PUT_USER]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    
    // Prevent self-deactivation
    if (currentUser.id === id) {
       return NextResponse.json({ error: "Anda tidak bisa menonaktifkan akun yang sedang aktif ini" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[DELETE_USER]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
