"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, ColumnDefinition } from "@/components/ui/DataTable";
import { User, Branch } from "@/types";
import { Plus, Pencil, Trash2, X, Store, ToggleLeft, ToggleRight } from "lucide-react";

export default function CabangPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirm state
  const [deleteData, setDeleteData] = useState<Branch | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, branchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/branches?all=true"), // include inactive
      ]);
      if (!userRes.ok) { router.push("/login"); return; }
      
      const userData = await userRes.json();
      if (userData.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      
      setUser(userData.user);
      setBranches(await branchRes.json());
    } catch {
      console.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditId(branch.id);
    setFormName(branch.name);
    setFormActive(branch.isActive ?? true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { showToast("Nama cabang wajib diisi", "error"); return; }
    
    setSaving(true);
    try {
      const url = editId ? `/api/branches/${editId}` : "/api/branches";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), isActive: formActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan cabang", "error");
      } else {
        showToast(editId ? "Perubahan cabang disimpan!" : "Cabang baru berhasil ditambahkan!", "success");
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
    if (!deleteData) return;
    try {
      const res = await fetch(`/api/branches/${deleteData.id}`, { method: "DELETE" });
      if (!res.ok) {
         showToast("Gagal menonaktifkan cabang", "error");
      } else {
         showToast(`Cabang ${deleteData.name} dinonaktifkan`, "success");
         setDeleteData(null);
         fetchData();
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const columns: ColumnDefinition<Branch>[] = [
    {
      key: "name",
      header: "Nama Cabang",
      align: "left",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Store size={18} className="text-emerald-600" />
          </div>
          <span className={`font-bold ${item.isActive === false ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {item.name}
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (item) => (
        <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
          item.isActive !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {item.isActive !== false ? "Aktif" : "Nonaktif"}
        </span>
      )
    },
    {
      key: "action",
      header: "Aksi",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-2 pr-2">
          <button
            onClick={() => openEditModal(item)}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Edit Cabang"
          >
            <Pencil size={18} strokeWidth={2.5} />
          </button>
          {item.isActive !== false && (
            <button
              onClick={() => setDeleteData(item)}
              className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Nonaktifkan"
            >
              <Trash2 size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )
    }
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell user={user} title="Manajemen Cabang">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteData}
        title="Nonaktifkan Cabang?"
        description={`Cabang "${deleteData?.name}" akan dinonaktifkan. Anda tidak akan bisa melakukan input penjualan di cabang ini lagi.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        onConfirm={executeDelete}
        onCancel={() => setDeleteData(null)}
      />

      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-400">
            Total {branches.length} cabang ditemukan
          </p>
          <button
             onClick={openAddModal}
             className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-[18px] hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Tambah Cabang</span>
          </button>
        </div>

        <DataTable
          data={branches}
          columns={columns}
          emptyTitle="Belum Ada Cabang"
          emptySubtitle="Sistem Anda belum memiliki cabang. Tambahkan untuk mulai berjualan."
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-[32px] shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="font-black text-xl text-gray-900">
                {editId ? "Ubah Data Cabang" : "Tambah Cabang"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Cabang</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Cabang Seturan"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 font-semibold transition-all"
                />
              </div>

              {editId && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status Aktif</label>
                  <button
                    onClick={() => setFormActive(!formActive)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:bg-emerald-50 transition-all font-bold text-gray-700 active:scale-[0.98]"
                  >
                    <span>{formActive ? "Ganti ke: Nonaktif" : "Ganti ke: Aktif"}</span>
                    {formActive ? (
                      <ToggleRight size={32} strokeWidth={2.5} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={32} strokeWidth={2.5} className="text-gray-400" />
                    )}
                  </button>
                  <p className="text-xs font-semibold text-gray-400 mt-2 px-1">
                    Cabang yang nonaktif tidak akan muncul di opsi kasir saat input penjualan.
                  </p>
                </div>
              )}
            </div>

            <button
               onClick={handleSave}
               disabled={saving}
               className="w-full bg-gray-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-gray-800 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-gray-900/10"
            >
              {saving ? "Menyimpan Data..." : "Simpan Cabang"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
