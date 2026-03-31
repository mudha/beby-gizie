"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { FilterBar } from "@/components/ui/FilterBar";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { DataTable, ColumnDefinition } from "@/components/ui/DataTable";
import { formatRupiah, formatTanggalSingkat, formatTanggalInput } from "@/lib/format";
import { User, DashboardSummary, BranchStat, MethodStat, TopProduct, Transaction, Branch } from "@/types";
import { TrendingUp, Store, Utensils, Coins, CalendarDays, ShoppingBag } from "lucide-react";

interface DashboardData {
  summary: DashboardSummary;
  branchStats: BranchStat[];
  methodStats: MethodStat[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(formatTanggalInput(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatTanggalInput(today));
  const [branchId, setBranchId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (branchId) params.set("branchId", branchId);

      const [userRes, dashRes, branchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/dashboard?${params}`),
        fetch("/api/branches"),
      ]);

      if (!userRes.ok) { router.push("/login"); return; }
      setUser((await userRes.json()).user);
      setData(await dashRes.json());
      setBranches(await branchRes.json());
    } catch {
      console.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router, startDate, endDate, branchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const maxBranchAmount = Math.max(...data.branchStats.map(s => s.totalAmount), 1);

  const transactionColumns: ColumnDefinition<Transaction>[] = [
    {
      key: "no",
      header: "Nomor Trx",
      align: "left",
      cell: (item) => <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[11px] font-black">{item.transactionNumber}</code>
    },
    {
      key: "date",
      header: "Tanggal",
      align: "left",
      cell: (item) => <span className="font-medium text-gray-500">{formatTanggalSingkat(item.createdAt)}</span>
    },
    {
      key: "branch",
      header: "Cabang",
      align: "left",
      cell: (item) => <span className="font-bold text-gray-800">{item.branch?.name}</span>
    },
    {
      key: "amount",
      header: "Total",
      align: "right",
      cell: (item) => <span className="font-black text-emerald-700 whitespace-nowrap">{formatRupiah(item.totalAmount)}</span>
    }
  ];

  return (
    <AppShell user={user} title="Ringkasan Dashboard">
      <div className="max-w-6xl mx-auto space-y-6">

        <FilterBar title="Filter Laporan">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Akhir</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cabang</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700 font-semibold appearance-none">
              <option value="">Semua Cabang</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
        </FilterBar>

        {/* Top Summary Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total Penjualan" value={data.summary.totalAmount} isCurrency icon={<Coins size={28} />} colorType="orange" />
          <SummaryCard title="Transaksi" value={data.summary.transactionCount} subtitle="Total pesanan yang diproses" icon={<ShoppingBag size={28} />} colorType="blue" />
          <SummaryCard title="Rata-Rata" value={data.summary.avgPerTransaction} isCurrency subtitle="Pendapatan rata-rata per pesanan" icon={<TrendingUp size={28} />} colorType="green" />
        </div>

        {/* Graphics Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Cabang */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Store size={20} />
              </div>
              <h3 className="font-extrabold text-gray-800 text-lg tracking-tight">Perincian Cabang</h3>
            </div>
            {data.branchStats.length === 0 ? (
              <p className="text-gray-400 italic font-medium m-auto">Tidak ada data cabang</p>
            ) : (
              <div className="space-y-5">
                {data.branchStats.map(stat => (
                  <div key={stat.branchId}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-gray-700 truncate">{stat.branchName}</span>
                      <span className="text-sm font-semibold text-gray-500">{stat.count} pesanan</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(stat.totalAmount / maxBranchAmount) * 100}%` }} />
                    </div>
                    <p className="font-black text-emerald-700 mt-2">{formatRupiah(stat.totalAmount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Selling */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Utensils size={20} />
            </div>
            <h3 className="font-extrabold text-gray-800 text-lg tracking-tight">Menu Terlaris</h3>
          </div>
          {data.topProducts.length === 0 ? (
             <p className="text-gray-400 italic font-medium text-center pb-4">Belum ada statistik produk</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {data.topProducts.map((product, idx) => (
                 <div key={product.name} className="flex items-center gap-4 p-4 rounded-[20px] bg-gray-50 border border-gray-100 hover:shadow-sm hover:border-orange-200 transition-all group">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform bg-white text-orange-gradient text-emerald-600 shrink-0 shadow-sm border border-gray-100">
                     #{idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-gray-900 truncate">{product.name}</p>
                     <p className="text-sm font-semibold text-gray-500 mt-0.5">{product.totalQty} terjual</p>
                   </div>
                   <p className="font-black text-emerald-700">{formatRupiah(product.totalAmount)}</p>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Recent Trx */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
               <CalendarDays size={20} />
             </div>
             <h3 className="font-extrabold text-gray-800 text-lg tracking-tight">Riwayat Terbaru</h3>
          </div>
          
          <div className="p-5">
            <DataTable
              data={data.recentTransactions}
              columns={transactionColumns}
              emptyTitle="Belum Ada Transaksi"
              emptySubtitle="Belum ada transaksi di periode waktu ini"
            />
          </div>
        </div>

      </div>
    </AppShell>
  );
}
