import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const COOKIE_NAME = "om-kebab-token";

// Route yang tidak perlu auth
const PUBLIC_ROUTES = ["/login", "/api/auth/login", "/api/setup"];

// Route khusus admin
const ADMIN_ROUTES = ["/dashboard", "/produk", "/transaksi", "/api/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass route publik
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Bypass aset statis
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Cek token
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = await verifyToken(token);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Cek akses admin-only routes
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute && user.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/penjualan", req.url));
  }

  // Redirect root
  if (pathname === "/") {
    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/penjualan", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
