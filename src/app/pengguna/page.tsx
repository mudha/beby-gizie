"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, ColumnDefinition } from "@/components/ui/DataTable";
import { User, Branch } from "@/types";
import { Plus, Pencil, Trash2, X, Users, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";

export default function PenggunaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("EMPLOYEE");
  const [formBranchId, setFormBranchId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirm state
  const [deleteData, setDeleteData] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [authRes, userRes, branchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/users?all=true"), // include inactive
        fetch("/api/branches"), 
      ]);
      if (!authRes.ok) { router.push("/login"); return; }
      
      const authData = await authRes.json();
      if (authData.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      
      if (!userRes.ok || !branchRes.ok) throw new Error("Gagal memuat pengguna atau cabang");

      setCurrentUser(authData.user);
      const usersData = await userRes.json();
      const branchesData = await branchRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch {
      console.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("EMPLOYEE");
    setFormBranchId("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (targetUser: User) => {
    setEditId(targetUser.id);
    setFormName(targetUser.name);
    setFormUsername(targetUser.username);
    setFormPassword(""); // Kosongkan, hanya isi jika mau ganti sandi
    setFormRole(targetUser.role);
    setFormBranchId(targetUser.branchId || "");
    setFormActive(targetUser.isActive ?? true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUsername.trim()) { 
      showToast("Nama dan Username wajib diisi", "error"); return; 
    }
    if (!editId && !formPassword) {
      showToast("Sandi wajib diisi untuk karyawan baru", "error"); return;
    }
    if (formRole === "EMPLOYEE" && !formBranchId) {
      showToast("Karyawan wajib ditugaskan ke cabang", "error"); return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        username: formUsername.trim(),
        role: formRole,
        branchId: formRole === "ADMIN" ? null : formBranchId,
        isActive: formActive,
        ...(formPassword && { password: formPassword }) // Kirim sandi hanya jika input tak kosong
      };

      const url = editId ? `/api/users/${editId}` : "/api/users";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan pengguna", "error");
      } else {
        showToast(editId ? "Perubahan akun disimpan!" : "Akun baru berhasil didaftarkan!", "success");
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
      const res = await fetch(`/api/users/${deleteData.id}`, { method: "DELETE" });
      if (!res.ok) {
         const d = await res.json();
         showToast(d.error || "Gagal menonaktifkan pengguna", "error");
      } else {
         showToast(`Akun ${deleteData.name} dinonaktifkan`, "success");
         setDeleteData(null);
         fetchData();
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const columns: ColumnDefinition<User>[] = [
    {
      key: "name",
      header: "Nama Pengguna",
      align: "left",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-500 font-bold text-sm uppercase tracking-wider">{item.name.charAt(0)}</span>
          </div>
          <div className={`min-w-0 ${item.isActive === false ? 'opacity-50 grayscale' : ''}`}>
             <p className={`font-bold text-sm ${item.isActive === false ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{item.name}</p>
             <p className="text-xs text-gray-500">@{item.username}</p>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Peran",
      align: "center",
      cell: (item) => (
        <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase ${
          item.role === "ADMIN" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-600"
        } ${item.isActive === false ? 'opacity-50' : ''}`}>
          {item.role === "ADMIN" ? "Admin" : "Kasir"}
        </span>
      )
    },
    {
      key: "branch",
      header: "Penempatan",
      align: "left",
      cell: (item) => (
        <span className={`font-semibold text-gray-600 text-xs ${item.isActive === false ? 'opacity-50' : ''}`}>
          {item.role === "ADMIN" ? "Akses Pusat" : item.branch?.name || "Belum Ditugaskan"}
        </span>
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
          {item.isActive !== false ? "Aktif" : "Non-aktif"}
        </span>
      )
    },
    {
      key: "action",
      header: "Aksi",
      align: "right",
      cell: (item) => {
        const isSelf = currentUser?.id === item.id;
        return (
          <div className="flex items-center justify-end gap-2 pr-2">
            <button
              onClick={() => openEditModal(item)}
              className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Edit Akun"
            >
              <Pencil size={18} strokeWidth={2.5} />
            </button>
            {item.isActive !== false && (
              <button
                onClick={() => setDeleteData(item)}
                disabled={isSelf}
                className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-gray-50 disabled:hover:text-gray-500 transition-colors"
                title={isSelf ? "Tidak bisa menonaktifkan akun sendiri" : "Nonaktifkan Akun"}
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell user={currentUser} title="Manajemen Pengguna">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteData}
        title="Nonaktifkan Karyawan?"
        description={`Akun "${deleteData?.name}" akan dinonaktifkan. Pengguna tidak akan bisa melakukan login sistem lagi setelah ini.`}
        confirmLabel="Ya, Cabut Akses"
        cancelLabel="Batal"
        onConfirm={executeDelete}
        onCancel={() => setDeleteData(null)}
      />

      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-400">
            Total {users.length} staf terdaftar dalam sistem
          </p>
          <button
             onClick={openAddModal}
             className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-[18px] hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Tambah Pengguna</span>
          </button>
        </div>

        <DataTable
          data={users}
          columns={columns}
          emptyTitle="Belum Ada Pengguna"
          emptySubtitle="Sistem Anda belum memiliki karyawan yang terdaftar."
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#f8fafc] w-full sm:max-w-2xl sm:rounded-3xl rounded-t-[32px] shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white sm:rounded-t-3xl rounded-t-[32px] shrink-0 sticky top-0 z-10 shadow-sm">
              <h2 className="font-black text-xl text-gray-900 flex items-center gap-2">
                <Users size={24} className="text-emerald-600" />
                {editId ? "Pembaruan Akun Staf" : "Registrasi Akun Staf"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                   <input
                     type="text"
                     value={formName}
                     onChange={(e) => setFormName(e.target.value)}
                     placeholder="Budi Santoso"
                     className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none text-gray-900 font-bold transition-all"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username Akses</label>
                   <div className="relative">
                      <span className="absolute left-5 inset-y-0 flex items-center font-bold text-gray-400">@</span>
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="kasir.budi"
                        className="w-full pl-10 pr-5 py-4 rounded-2xl bg-white border border-gray-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none text-gray-900 font-bold transition-all"
                      />
                   </div>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Kata Sandi Akses</span>
                  {editId && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md normale-case">Opsi: Boleh dibiarkan kosong bila tidak ingin ganti.</span>}
                </label>
                <div className="relative">
                   <div className="absolute left-5 inset-y-0 flex items-center">
                     <KeyRound size={18} className="text-gray-400" />
                   </div>
                   <input
                     type="password"
                     value={formPassword}
                     onChange={(e) => setFormPassword(e.target.value)}
                     placeholder={editId ? "Ketikan sandi baru jika ingin merubah..." : "Rahasia. Masukkan sandi baru..."}
                     className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white border border-gray-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none text-gray-900 font-bold tracking-widest transition-all"
                   />
                </div>
              </div>
              
              <div className="bg-gray-100/50 p-1 flex rounded-[20px]">
                 <button
                    onClick={() => { setFormRole("EMPLOYEE"); setFormBranchId(""); }}
                    className={`flex-1 py-3.5 text-sm font-black transition-all rounded-[16px] ${formRole === "EMPLOYEE" ? 'bg-white text-blue-600 shadow-sm border border-gray-200 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                 >
                    Akses Karyawan / Kasir
                 </button>
                 <button
                    onClick={() => { setFormRole("ADMIN"); setFormBranchId(""); }}
                    className={`flex-1 py-3.5 text-sm font-black transition-all rounded-[16px] ${formRole === "ADMIN" ? 'bg-white text-emerald-700 shadow-sm border border-gray-200 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                 >
                    Akses Administrator (Pusat)
                 </button>
              </div>

              {formRole === "EMPLOYEE" && (
                <div className="bg-emerald-50 animate-fade-in p-5 rounded-[20px] border border-emerald-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Penugasan Cabang</label>
                  <select
                     value={formBranchId}
                     onChange={(e) => setFormBranchId(e.target.value)}
                     className="w-full px-5 py-4 rounded-xl bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 font-bold appearance-none shadow-sm"
                  >
                     <option value="" disabled>Harap Tunjuk Cabang Penugasan...</option>
                     {branches.map(b => (
                       <option key={b.id} value={b.id}>{b.name} {b.isActive === false ? '(Peringatan: Nonaktif)' : ''}</option>
                     ))}
                  </select>
                </div>
              )}

              {editId && currentUser?.id !== editId && (
                <div className="flex items-center justify-between p-5 rounded-[20px] bg-white border-2 border-gray-100">
                  <div className="pr-4">
                     <p className="font-bold text-gray-800">Status Akses / Cuti</p>
                     <p className="text-xs font-semibold text-gray-400 mt-1">Nonaktifkan untuk menangguhkan akses masuk login orang ini ke sistem kasir.</p>
                  </div>
                  <button
                    onClick={() => setFormActive(!formActive)}
                    className="flex items-center gap-2 p-2 shrink-0 active:scale-95 transition-transform"
                  >
                    {formActive ? (
                      <ToggleRight size={40} strokeWidth={2.5} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={40} strokeWidth={2.5} className="text-gray-300" />
                    )}
                  </button>
                </div>
              )}

            </div>

             <div className="p-6 bg-white shrink-0 sm:rounded-b-3xl rounded-none border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
               <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white font-black py-4.5 rounded-2xl hover:bg-gray-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center text-lg gap-2"
               >
                  {saving ? (
                    <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                  ) : "Simpan Konfigurasi Akun"}
               </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
