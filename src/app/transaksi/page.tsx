"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { FilterBar } from "@/components/ui/FilterBar";
import { DataTable, ColumnDefinition } from "@/components/ui/DataTable";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { formatTanggalSingkat, formatTanggalInput, labelMetode } from "@/lib/format";
import { User, Transaction, Branch } from "@/types";
import { ChevronLeft, ChevronRight, Eye, X, ClipboardList, Trash2 } from "lucide-react";

type TransactionDetail = Transaction;

export default function TransaksiPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(formatTanggalInput(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatTanggalInput(today));
  const [branchId, setBranchId] = useState("");
  const [salesMethod, setSalesMethod] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (branchId) params.set("branchId", branchId);
      if (salesMethod) params.set("salesMethod", salesMethod);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const [userRes, trxRes, branchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/transactions?${params}`),
        fetch("/api/branches"),
      ]);

      if (!userRes.ok) { router.push("/login"); return; }
      setUser((await userRes.json()).user);
      const trxData = await trxRes.json();
      setTransactions(trxData.transactions);
      setTotal(trxData.total);
      setBranches(await branchRes.json());
    } catch {
      console.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [router, startDate, endDate, branchId, salesMethod, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (res.ok) setDetail(await res.json());
    } catch {
      console.error("Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.")) return;
    
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDetailOpen(false);
        setDetail(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus transaksi.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const columns: ColumnDefinition<Transaction>[] = [
    {
      key: "no",
      header: "Nomor Trx",
      align: "left",
      cell: (item) => <code className="bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-black">{item.transactionNumber}</code>
    },
    {
      key: "date",
      header: "Tanggal",
      align: "left",
      cell: (item) => <span className="font-semibold text-gray-500">{formatTanggalSingkat(item.createdAt)}</span>
    },
    {
      key: "branch",
      header: "Cabang",
      align: "left",
      cell: (item) => <span className="font-bold text-gray-800">{item.branch?.name}</span>
    },
    {
      key: "kasir",
      header: "Kasir",
      align: "left",
      cell: (item) => <span className="font-semibold text-gray-500">{item.createdBy?.name}</span>
    },
    {
      key: "amount",
      header: "Total",
      align: "right",
      cell: (item) => <CurrencyText amount={item.totalAmount} className="font-black text-emerald-700 text-base whitespace-nowrap" />
    },
    {
      key: "action",
      header: "",
      align: "center",
      cell: (item) => (
        <button
          onClick={() => openDetail(item.id)}
          className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
          title="Lihat Detail Transaksi"
        >
          <Eye size={18} strokeWidth={2.5} />
        </button>
      )
    }
  ];

  return (
    <AppShell user={user} title="Riwayat Transaksi">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <FilterBar title="Saring Riwayat">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Akhir</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cabang</label>
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold appearance-none">
              <option value="">Semua Cabang</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
        </FilterBar>

        <div className="flex items-center justify-between pb-2">
           <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
             <ClipboardList size={24} className="text-emerald-600" /> Daftar Transaksi
           </h2>
           <p className="text-sm font-semibold text-gray-400 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{total} Data Ditemukan</p>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <DataTable
            data={transactions}
            columns={columns}
            emptyTitle="Tidak Ada Transaksi"
            emptySubtitle="Ubah filter pencarian Anda untuk melihat data lain."
          />
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 p-8 text-center">
              <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
               <p className="text-gray-500 font-bold mb-1">Tidak Ada Transaksi</p>
               <p className="text-gray-400 text-sm">Coba ubah tanggal atau filter lainnya.</p>
            </div>
          ) : (
            transactions.map((trx) => (
              <div key={trx.id} onClick={() => openDetail(trx.id)} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <code className="text-[11px] font-black text-gray-400 tracking-widest">{trx.transactionNumber}</code>
                    <CurrencyText amount={trx.totalAmount} className="block text-lg font-black text-gray-900 mt-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-3 border-t border-gray-100">
                  <span>{trx.branch?.name} • Kasir: {trx.createdBy?.name}</span>
                  <span>{formatTanggalSingkat(trx.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 hover:border-orange-300 disabled:opacity-40 shadow-sm active:scale-95 transition-all"
            >
              <ChevronLeft strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-12 h-12 rounded-[18px] text-sm font-black transition-all active:scale-95 ${
                      page === pageNum
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                        : "bg-white text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-emerald-700 shadow-sm"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 hover:border-orange-300 disabled:opacity-40 shadow-sm active:scale-95 transition-all"
            >
              <ChevronRight strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Nota / Struk Modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => { setDetailOpen(false); setDetail(null); }} />
          <div className="relative bg-[#f8fafc] w-full sm:max-w-md sm:rounded-3xl rounded-t-[32px] shadow-2xl animate-slide-up flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white sm:rounded-t-3xl rounded-t-[32px] shrink-0 sticky top-0 z-10 shadow-sm">
              <div>
                <h2 className="font-black text-xl text-gray-900">Nota Transaksi</h2>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{detail?.transactionNumber || "Menyiapkan..."}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.role === "ADMIN" && detail && (
                  <button
                    onClick={() => handleDelete(detail.id)}
                    disabled={deleteLoading}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors disabled:opacity-50"
                    title="Hapus Transaksi"
                  >
                    {deleteLoading ? <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={20} strokeWidth={2.5} />}
                  </button>
                )}
                <button
                  onClick={() => { setDetailOpen(false); setDetail(null); }}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-500 font-bold">Mengunduh Data...</p>
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  {/* Status Blocks */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Tanggal</p>
                        <p className="text-sm font-bold text-gray-800">{formatTanggalSingkat(detail.createdAt)}</p>
                     </div>
                     <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Cabang</p>
                        <p className="text-sm font-bold text-gray-800">{detail.branch?.name}</p>
                     </div>
                     <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Kasir</p>
                        <p className="text-sm font-bold text-gray-800">{detail.createdBy?.name}</p>
                     </div>
                  </div>

                  {/* Keriting Struk */}
                  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 -mx-2">
                     <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwTDEwIDEwWiIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] bg-repeat-x rotate-180 -mt-2"></div>
                     <div className="p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 text-center border-b border-dashed border-gray-200 pb-4">Pesanan Pelanggan</h3>
                        <div className="space-y-4">
                          {detail.items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-start">
                              <div className="flex-1 pr-4">
                                <p className="font-bold text-gray-800 text-sm leading-snug">{item.productNameSnapshot}</p>
                                <p className="text-[11px] font-bold text-gray-400 mt-1">{item.quantity} &times; <CurrencyText amount={item.priceSnapshot} /></p>
                              </div>
                              <CurrencyText amount={item.subtotal} className="font-black text-gray-800 text-sm" />
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 border-b-2 pb-4 flex justify-between items-center">
                          <p className="font-black text-gray-800 tracking-wider">TOTAL IMPAS</p>
                          <CurrencyText amount={detail.totalAmount} className="text-xl font-black text-emerald-700" />
                        </div>
                        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-6">Terima Kasih</p>
                     </div>
                     <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwTDEwIDEwWiIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] bg-repeat-x shrink-0 -mb-2"></div>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="p-6 bg-white shrink-0 sm:rounded-b-3xl rounded-none border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
               <button
                  onClick={() => { setDetailOpen(false); setDetail(null); }}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-gray-800 active:scale-95 transition-all"
               >
                  Tutup Nota
               </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
