"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X, LayoutDashboard, ShoppingCart, Package, ClipboardList, Store, Users, MapPin, KeyRound } from "lucide-react";
import { User } from "@/types";
import { Toast, useToast } from "@/components/ui/Toast";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
  title?: string;
}

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Riwayat Transaksi", icon: ClipboardList },
  { href: "/produk", label: "Manajemen Produk", icon: Package },
  { href: "/pengguna", label: "Manajemen Pengguna", icon: Users },
  { href: "/cabang", label: "Manajemen Cabang", icon: Store },
  { href: "/penjualan", label: "Input Penjualan", icon: ShoppingCart }, // Admin juga bisa input
];

const employeeNav = [
  { href: "/penjualan", label: "Input Penjualan", icon: ShoppingCart },
];

export default function AppShell({ user, children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navItems = user.role === "ADMIN" ? adminNav : employeeNav;
  const { toast, showToast, hideToast } = useToast();

  // Change Password State
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Tutup sidebar otomatis kalau pindah halaman di mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      showToast("Sandi baru tidak boleh kosong", "error");
      return;
    }
    
    // For now we assume if role is not admin, it might fail based on API, 
    // but the user asked for Admin change password explicitly.
    setPwdLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Hanya mengirim role eksisting dan password baru
        body: JSON.stringify({ role: user.role, password: newPassword.trim() }),
      });
      if (res.ok) {
        showToast("Kata sandi berhasil diubah!", "success");
        setPwdModalOpen(false);
        setNewPassword("");
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal mengubah kata sandi", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4 px-6 py-6 border-b border-gray-100/80">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <span className="text-white font-black text-lg tracking-tight">BG</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-gray-900 text-lg leading-tight truncate">Beby Gizie</h2>
            <p className="text-[13px] font-medium text-gray-400">Asli Beras Organik</p>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="px-6 py-5 mx-4 mt-6 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-3 relative group transition-all hover:bg-white hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-emerald-200">
            <span className="text-emerald-600 font-bold text-base">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs font-semibold text-emerald-600 truncate">{user.role === "ADMIN" ? "Administrator" : "Karyawan"}</p>
          </div>
          <button 
            onClick={() => setPwdModalOpen(true)}
            className="absolute right-4 p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
            title="Ubah Kata Sandi"
          >
            <KeyRound size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 group w-full px-4 py-4 rounded-2xl text-red-500 bg-red-50/50 hover:bg-red-100 border border-transparent hover:border-red-100 transition-all font-bold text-[15px]"
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-[280px] min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 lg:px-8 lg:py-5 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-gray-900 text-xl lg:text-2xl truncate">{title}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in relative">
          {children}
        </main>
      </div>

      {/* Modal Ganti Sandi */}
      {pwdModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setPwdModalOpen(false)} />
          <div className="relative bg-[#f8fafc] w-full max-w-sm rounded-[32px] shadow-2xl animate-scale-in flex flex-col">
            <div className="p-6 border-b border-gray-200/50 bg-white rounded-t-[32px] flex items-center justify-between">
              <h2 className="font-black text-xl text-gray-900 flex items-center gap-2">
                <KeyRound size={22} className="text-emerald-600" /> Ubah Sandi
              </h2>
              <button onClick={() => setPwdModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik rahasia baru..."
                  className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none text-gray-900 font-bold tracking-widest transition-all"
                />
              </div>
            </div>
            <div className="p-6 pt-2 shrink-0">
              <button
                onClick={handleChangePassword}
                disabled={pwdLoading}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all text-base disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwdLoading ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Menyimpan...</> : "Simpan Sandi Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
