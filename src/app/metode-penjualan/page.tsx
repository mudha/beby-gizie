"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { User, SalesMethod } from "@/types";
import { Plus, Pencil, Trash2, X, Check, Store } from "lucide-react";

export default function MetodePenjualanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [methods, setMethods] = useState<SalesMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirm state
  const [deleteMethod, setDeleteMethod] = useState<SalesMethod | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, methodsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/sales-methods"),
      ]);
      if (!userRes.ok) { router.push("/login"); return; }
      if (!methodsRes.ok) throw new Error("Gagal memuat data metode penjualan");

      setUser((await userRes.json()).user);
      const data = await methodsRes.json();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to load sales methods");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormCode("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (method: SalesMethod) => {
    setEditId(method.id);
    setFormName(method.name);
    setFormCode(method.code);
    setFormActive(method.isActive);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) { 
      showToast("Nama dan Kode wajib diisi", "error"); 
      return; 
    }

    setSaving(true);
    try {
      const url = editId ? `/api/sales-methods/${editId}` : "/api/sales-methods";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formName.trim(), 
          code: formCode.trim().toUpperCase(), 
          isActive: formActive 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan metode penjualan", "error");
      } else {
        showToast(editId ? "Pembaruan disimpan!" : "Metode baru ditambahkan!", "success");
        setModalOpen(false);
        fetchData();
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteMethod) return;
    try {
      const res = await fetch(`/api/sales-methods/${deleteMethod.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Gagal menghapus", "error");
      } else {
        showToast(`Metode ${deleteMethod.name} dinonaktifkan/dihapus`, "success");
        setDeleteMethod(null);
        fetchData();
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMethods = methods.filter(m => m.isActive);
  const inactiveMethods = methods.filter(m => !m.isActive);

  return (
    <AppShell user={user} title="Metode Penjualan">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteMethod}
        title="Hapus Metode Penjualan?"
        description={`Metode "${deleteMethod?.name}" akan dihapus. Ini mungkin berdampak pada kalkulasi harga.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={executeDelete}
        onCancel={() => setDeleteMethod(null)}
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-400 tracking-wider uppercase">
            {activeMethods.length} Aktif &bull; {inactiveMethods.length} Tidak Aktif
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold px-6 py-3.5 sm:py-3 rounded-[18px] hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 transition-all z-10 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Tambah Metode</span>
          </button>
        </div>

        {/* Tabel Metode Aktif */}
        <div>
          <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
            <Store size={24} className="text-emerald-600" /> Metode Tersedia
          </h2>
          {activeMethods.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 p-8 text-center text-gray-500 font-medium">
              Belum ada metode penjualan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMethods.map((method) => (
                <div key={method.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Store size={24} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-gray-900 text-base truncate">{method.name}</p>
                    <p className="text-emerald-700 font-black text-sm">{method.code}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(method)}
                      className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setDeleteMethod(method)}
                      className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabel Metode Nonaktif */}
        {inactiveMethods.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-gray-400 mb-4 flex items-center gap-2">
              <Store size={24} className="text-gray-400" /> Tidak Aktif
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-70">
              {inactiveMethods.map((method) => (
                <div key={method.id} className="bg-gray-50 rounded-[24px] p-4 border border-gray-200 flex items-center gap-4 grayscale transition-all hover:grayscale-0 focus-within:grayscale-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                    <Store size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-600 truncate">{method.name}</p>
                    <p className="text-gray-500 font-bold text-xs">{method.code}</p>
                  </div>
                  <button
                    onClick={() => openEditModal(method)}
                    className="shrink-0 px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-bold text-gray-700 border border-gray-200 hover:text-emerald-700 hover:border-orange-300 transition-all active:scale-95"
                  >
                    Atur
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-[32px] shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="font-black text-xl text-gray-900">
                {editId ? "Atur Metode Penjualan" : "Tambah Metode Baru"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Metode</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: ShopeeFood"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kode Metode (Unik)</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: SHOPEEFOOD"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 font-semibold transition-all"
                  disabled={!!editId} // Hanya bisa di set saat create awal jika mau
                />
                {editId && <p className="text-xs text-gray-500 mt-1">Kode tidak dapat diubah setelah dibuat.</p>}
              </div>

              {editId && (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="pr-4">
                    <p className="font-bold text-gray-800">Status</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5 whitespace-normal">Metode {formActive ? "aktif" : "tidak aktif"} untuk transaksi</p>
                  </div>
                  <button
                    onClick={() => setFormActive(!formActive)}
                    className={`relative w-14 h-8 rounded-full transition-colors flex shrink-0 items-center overflow-hidden border-2 ${
                      formActive ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-200"
                    }`}
                  >
                    <div className={`absolute w-6 h-6 bg-white rounded-full transition-transform shadow-sm flex items-center justify-center ${
                      formActive ? "translate-x-[24px]" : "translate-x-[2px]"
                    }`}>
                      {formActive && <Check size={14} className="text-emerald-600" strokeWidth={4} />}
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-extrabold text-lg py-4 rounded-[20px] hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
