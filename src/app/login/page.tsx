"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast, useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username) { showToast("Masukkan username", "error"); return; }
    if (!form.password) { showToast("Masukkan password", "error"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Login gagal", "error"); return; }
      router.push(data.user.role === "ADMIN" ? "/dashboard" : "/penjualan");
      router.refresh();
    } catch {
      showToast("Terjadi kesalahan, silakan coba lagi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-emerald-100 selection:text-emerald-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="w-full max-w-[400px]">
        {/* Header / Logo */}
        <div className="text-center mb-10 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="w-20 h-20 rounded-[24px] bg-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-600/20">
            <span className="text-white font-black text-3xl tracking-tighter">BG</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Masuk ke Beby Gizie</h1>
          <p className="text-gray-500 text-base mt-2 font-medium">Asli Beras Organik</p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 p-8 border border-gray-100 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Username</label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    autoComplete="username"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 placeholder-gray-400 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 placeholder-gray-400 font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-masuk"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/30 text-lg mt-8"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
            
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm font-medium text-gray-400 mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          Beby Gizie &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
