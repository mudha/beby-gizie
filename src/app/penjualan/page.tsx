"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProductCard from "@/components/ProductCard";
import { Toast, useToast } from "@/components/ui/Toast";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { Product, Branch, User } from "@/types";
import { Store, ShoppingBag, X } from "lucide-react";



export default function PenjualanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [methods, setMethods] = useState<{ id: string; name: string; code: string; isActive: boolean }[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [branchId, setBranchId] = useState("");
  const [salesMethod, setSalesMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // New features states
  const [dailyStats, setDailyStats] = useState<{ totalTransactions: number, totalAmount: number, transactions: any[] } | null>(null);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [userRes, productRes, branchRes, methodRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/products?active=true"),
        fetch("/api/branches"),
        fetch("/api/sales-methods?active=true"),
      ]);
      if (!userRes.ok) { router.push("/login"); return; }
      
      if (!productRes.ok || !branchRes.ok || !methodRes.ok) {
        throw new Error("Gagal mengambil data dari server");
      }

      const userData = await userRes.json();
      const productsData = await productRes.json();
      const branchesData = await branchRes.json();
      const methodsData = await methodRes.json();

      setUser(userData.user);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      
      const methodsArray = Array.isArray(methodsData) ? methodsData : [];
      setMethods(methodsArray);
      
      if (userData.user?.branchId) setBranchId(userData.user.branchId);
      if (methodsArray.length > 0) {
        const offlineMethod = methodsArray.find(m => m.code === "OFFLINE") || methodsArray[0];
        setSalesMethod(offlineMethod.code);
      }
    } catch (error) {
      console.error("Gagal memuat data penjualan:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchDailyStats = useCallback(async (bId: string) => {
    if (!bId) return;
    try {
      const res = await fetch(`/api/transactions/daily?branchId=${bId}`);
      if (res.ok) setDailyStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (branchId) fetchDailyStats(branchId);
  }, [branchId, fetchDailyStats]);

  const getProductPrice = (product: Product, methodCode: string) => {
    const methodObj = methods.find(m => m.code === methodCode);
    if (!methodObj) return 0; // fallback
    const priceObj = product.prices?.find(p => p.salesMethodId === methodObj.id);
    return priceObj ? priceObj.price : 0;
  };

  const totalAmount = products.reduce((sum, p) => {
    return sum + (quantities[p.id] ?? 0) * getProductPrice(p, salesMethod);
  }, 0);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleIncrease = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleDecrease = (id: string) => {
    setQuantities((prev) => {
      const cur = prev[id] ?? 0;
      if (cur <= 0) return prev;
      return { ...prev, [id]: cur - 1 };
    });
  };

  const handleReset = () => {
    setQuantities({});
    if (!user?.branchId) setBranchId("");
    if (methods.length > 0) {
      setSalesMethod(methods.find(m => m.code === "OFFLINE")?.code || methods[0].code);
    } else {
      setSalesMethod("");
    }
    setEditTransactionId(null);
  };

  const validateAndConfirm = () => {
    if (!branchId) { showToast("Pilih cabang terlebih dahulu", "error"); return; }
    if (totalItems === 0) { showToast("Transaksi tidak boleh kosong", "error"); return; }
    setConfirmModalOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmModalOpen(false);
    setLoading(true);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    
    try {
      const url = editTransactionId ? `/api/transactions/${editTransactionId}` : "/api/transactions";
      const method = editTransactionId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, salesMethod, items }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan transaksi", "error");
      } else {
        showToast(editTransactionId ? "Perubahan berhasil disimpan!" : "Transaksi berhasil disimpan!", "success");
        handleReset();
        if (branchId) fetchDailyStats(branchId);
      }
    } catch {
      showToast("Gagal menyimpan transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tx: any) => {
    const newQs: Record<string, number> = {};
    tx.items.forEach((item: any) => {
      newQs[item.productId] = item.quantity;
    });
    setQuantities(newQs);
    setSalesMethod(tx.salesMethod);
    setBranchId(tx.branchId);
    setEditTransactionId(tx.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Mode Edit aktif. Silahkan ubah pesanan.", "success");
  };

  const isToday = (dateStr: string) => {
    const tz = "Asia/Jakarta";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const txDate = new Date(dateStr).toLocaleDateString("en-CA", { timeZone: tz });
    return today === txDate;
  };

  const cancelEdit = () => {
    handleReset();
    showToast("Batal mengedit transaksi", "success");
  };

  if (initialLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user} title="Input Penjualan">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-xl mx-auto space-y-6 pb-40">
        
        {editTransactionId && (
           <div className="bg-emerald-100 border-2 border-emerald-600 rounded-[20px] p-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-black text-orange-800">Mode Edit Transaksi</p>
                 <p className="text-xs font-semibold text-emerald-700 mt-0.5">Anda sedang mengoreksi transaksi lama.</p>
              </div>
              <button onClick={cancelEdit} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                 Batal Edit
              </button>
           </div>
        )}

        {/* Settings Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-5">
          {/* Cabang Selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2.5">
              <Store size={18} className="text-emerald-600" /> Cabang Penjualan
            </label>
            <div className="relative">
              <select
                id="select-cabang"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={!!user.branchId || !!editTransactionId}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 text-gray-900 font-semibold appearance-none disabled:opacity-60 disabled:bg-gray-100 transition-all"
              >
                <option value="" disabled>Pilih Cabang Dulu...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

        </div>

        {/* Product List */}
        <div>
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Menu Tersedia</h2>
          {products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[24px] border border-gray-100">
              <p className="text-gray-500 font-medium">Belum ada menu yang aktif.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  price={getProductPrice(product, salesMethod)}
                  quantity={quantities[product.id] ?? 0}
                  onIncrease={() => handleIncrease(product.id)}
                  onDecrease={() => handleDecrease(product.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bagian Ringkasan Hari Ini */}
        {branchId && dailyStats && (
          <div className="mt-10 border-t border-gray-100 pt-8 space-y-6">
            <h3 className="text-xl font-black text-gray-800 mb-2">Ringkasan Hari Ini</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-1">
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Pemasukan Hari Ini</p>
                <CurrencyText amount={dailyStats.totalAmount} className="text-xl font-black text-emerald-700" />
              </div>
              <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-1">
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Jumlah Transaksi</p>
                <p className="text-xl font-black text-gray-900">{dailyStats.totalTransactions} <span className="text-sm font-bold text-gray-500">Trx</span></p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-gray-400 tracking-widest uppercase mb-4">Transaksi Hari Ini</h4>
              {dailyStats.transactions.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500 font-medium">Belum ada transaksi di cabang ini.</div>
              ) : (
                <div className="space-y-3">
                  {dailyStats.transactions.map((tx: any) => {
                    const editable = isToday(tx.createdAt);
                    return (
                      <div key={tx.id} className={`bg-white rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${editTransactionId === tx.id ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{tx.transactionNumber}</span>
                            <span className="text-xs font-bold text-gray-400">{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                          </div>
                          <CurrencyText amount={tx.totalAmount} className="text-base font-black text-gray-900" />
                          <p className="text-xs text-gray-500 mt-1">{tx.items.length} Macam Menu</p>
                        </div>
                        <div className="flex items-center gap-2 sm:self-center self-start">
                          {!editable ? (
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Tidak Bisa Diedit</span>
                          ) : (
                            <button
                              onClick={() => handleEditClick(tx)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${editTransactionId === tx.id ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-600 hover:text-emerald-700'}`}
                            >
                              {editTransactionId === tx.id ? 'Sedang Diedit...' : 'Edit'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-[32px] shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="font-black text-xl text-gray-900">
                Konfirmasi {editTransactionId ? "Perubahan" : "Simpan"}
              </h2>
              <button onClick={() => setConfirmModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 font-medium">Yakin ingin menyimpan transaksi ini?</p>
              <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-500">Cabang</span>
                  <span className="text-sm font-bold text-gray-800">{branches.find((b) => b.id === branchId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-500">Item</span>
                  <span className="text-sm font-bold text-gray-800">{totalItems} Item</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-700">Total Harga</span>
                  <CurrencyText amount={totalAmount} className="text-lg font-black text-emerald-700" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button disabled={loading} onClick={() => setConfirmModalOpen(false)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm disabled:opacity-50">
                Kembali Periksa
              </button>
              <button disabled={loading} onClick={handleSubmit} className="flex-1 flex items-center justify-center py-3.5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50">
                {loading ? "Menyimpan..." : "Ya, Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] z-30 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-4 lg:p-6 pb-safe">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          
          <div className="flex-1 w-full flex items-center justify-between sm:justify-start sm:gap-6 bg-emerald-50 rounded-[20px] p-4 border border-emerald-100/50">
            <div>
              <p className="text-[13px] font-bold tracking-wide text-emerald-700/70 mb-0.5 uppercase">Total Tagihan</p>
              <CurrencyText amount={totalAmount} className="text-2xl font-black text-emerald-700" />
            </div>
            <div className="text-right sm:text-left">
              <p className="text-[13px] font-bold tracking-wide text-emerald-700/70 mb-0.5 uppercase">Isi Pesanan</p>
              <p className="text-xl font-black text-emerald-700">{totalItems} <span className="text-base font-bold">Item</span></p>
            </div>
          </div>

          <button
            id="btn-simpan-transaksi"
            onClick={validateAndConfirm}
            disabled={loading || totalItems === 0}
            className="w-full sm:w-auto flex-1 bg-emerald-600 text-white font-black text-lg py-5 px-6 rounded-[20px] hover:bg-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {editTransactionId ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>

        </div>
      </div>
    </AppShell>
  );
}
