"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Toast, useToast } from "@/components/ui/Toast";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { User, Product, SalesMethod } from "@/types";
import { Plus, Pencil, Trash2, X, PackageOpen, Check, PackageX, Store } from "lucide-react";

export default function ProdukPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [methods, setMethods] = useState<SalesMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrices, setFormPrices] = useState<Record<string, string>>({});
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirm state
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, productRes, methodsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/products"),
        fetch("/api/sales-methods?active=true")
      ]);
      if (!userRes.ok) { router.push("/login"); return; }
      if (!productRes.ok) throw new Error("Gagal memuat data produk");

      setUser((await userRes.json()).user);
      
      const methodsData = await methodsRes.json();
      setMethods(Array.isArray(methodsData) ? methodsData : []);
      
      const productsData = await productRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormActive(true);
    
    // Set default empty prices
    const defaultPrices: Record<string, string> = {};
    methods.forEach(m => defaultPrices[m.id] = "");
    setFormPrices(defaultPrices);
    
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditId(product.id);
    setFormName(product.name);
    setFormActive(product.isActive);
    
    // Map existing prices
    const pricesMap: Record<string, string> = {};
    methods.forEach(m => {
      const existing = product.prices?.find(p => p.salesMethodId === m.id);
      pricesMap[m.id] = existing ? existing.price.toString() : "";
    });
    setFormPrices(pricesMap);
    
    setModalOpen(true);
  };

  const handlePriceChange = (methodId: string, value: string) => {
    setFormPrices(prev => ({
      ...prev,
      [methodId]: value
    }));
  };

  const handleSave = async () => {
    if (!formName.trim()) { showToast("Nama produk wajib diisi", "error"); return; }
    
    // Format prices array payload
    const parsedPrices: { salesMethodId: string, price: number }[] = [];
    for (const m of methods) {
      const rawPrice = formPrices[m.id];
      const parsedPrice = parseInt(rawPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        showToast(`Harga untuk ${m.name} tidak valid`, "error");
        return;
      }
      parsedPrices.push({
        salesMethodId: m.id,
        price: parsedPrice
      });
    }

    if (parsedPrices.length === 0) {
      showToast("Minimal satu harga penjualan wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formName.trim(), 
          prices: parsedPrices, 
          isActive: formActive 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan produk", "error");
      } else {
        showToast(editId ? "Pembaruan menu disimpan!" : "Menu baru ditambahkan!", "success");
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
    if (!deleteProduct) return;
    try {
      const res = await fetch(`/api/products/${deleteProduct.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Gagal menonaktifkan", "error");
      } else {
        showToast(`Menu ${deleteProduct.name} dinonaktifkan`, "success");
        setDeleteProduct(null);
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

  const activeProducts = products.filter(p => p.isActive);
  const inactiveProducts = products.filter(p => !p.isActive);

  // Helper function to get default offline price for display, or first available price
  const getDisplayPrice = (product: Product) => {
    if (product.prices && product.prices.length > 0) {
      // Find OFFLINE code if possible, but we don't know the code here unless we map it.
      // So let's just use the first price available
      return product.prices[0].price;
    }
    return 0;
  };

  return (
    <AppShell user={user} title="Manajemen Produk & Harga">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteProduct}
        title="Nonaktifkan Menu?"
        description={`Menu "${deleteProduct?.name}" akan disembunyikan dari aplikasi kasir dan tidak bisa dibeli lagi.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        onConfirm={executeDelete}
        onCancel={() => setDeleteProduct(null)}
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-400 tracking-wider uppercase">
            {activeProducts.length} Menu Aktif &bull; {inactiveProducts.length} Disembunyikan
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold px-6 py-3.5 sm:py-3 rounded-[18px] hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 transition-all z-10 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Tambah Menu Baru</span>
          </button>
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
            <PackageOpen size={24} className="text-emerald-600" /> Menu Tersedia
          </h2>
          {activeProducts.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 p-8 text-center text-gray-500 font-medium">
              Belum ada menu yang bisa dijual.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <PackageOpen size={24} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-gray-900 text-base truncate">{product.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      {product.prices && product.prices.length > 0 ? (
                        product.prices.map((p, i) => {
                          const methodName = methods.find(m => m.id === p.salesMethodId)?.code || "Metode";
                          return (
                            <span key={p.id} className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                              {methodName}: <CurrencyText amount={p.price} className="text-emerald-700 font-bold" />
                            </span>
                          );
                        })
                      ) : (
                        <CurrencyText amount={getDisplayPrice(product)} className="text-emerald-700 font-black" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(product)}
                      className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      title="Edit Menu"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setDeleteProduct(product)}
                      className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Nonaktifkan"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {inactiveProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-gray-400 mb-4 flex items-center gap-2">
              <PackageX size={24} className="text-gray-400" /> Menu Disembunyikan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-70">
              {inactiveProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-[24px] p-4 border border-gray-200 flex items-center gap-4 grayscale transition-all hover:grayscale-0 focus-within:grayscale-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                    <PackageX size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-600 line-through truncate">{product.name}</p>
                    <CurrencyText amount={getDisplayPrice(product)} className="text-gray-500 font-bold" />
                  </div>
                  <button
                    onClick={() => openEditModal(product)}
                    className="shrink-0 px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-bold text-gray-700 border border-gray-200 hover:text-emerald-700 hover:border-orange-300 transition-all active:scale-95"
                  >
                    Atur Ulang
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
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-[32px] shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="font-black text-xl text-gray-900">
                {editId ? "Pengaturan Menu" : "Tambah Menu Baru"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Menu</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kebab Ceria"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Harga per Metode Penjualan</label>
                
                {methods.length === 0 ? (
                  <p className="text-sm text-red-500 bg-red-50 py-3 px-4 rounded-xl border border-red-100">
                    Anda belum memiliki Metode Penjualan yang aktif. Silakan tambahkan di halaman Manajemen Metode terlebih dahulu.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {methods.map(method => (
                      <div key={method.id} className="relative flex items-center">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Store size={16} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-500">{method.name}</span>
                        </div>
                        <span className="absolute left-32 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                        <input
                          type="number"
                          value={formPrices[method.id] || ""}
                          onChange={(e) => handlePriceChange(method.id, e.target.value)}
                          placeholder="15000"
                          min="0"
                          className="w-full pl-40 pr-5 py-4 rounded-[16px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-600 focus:outline-none text-gray-900 font-black tracking-wider transition-all text-right"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editId && (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="pr-4">
                    <p className="font-bold text-gray-800">Status Menu</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5 whitespace-normal">Menu {formActive ? "akan tampil" : "dihilangkan"} di halaman kasir</p>
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
              disabled={saving || methods.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-extrabold text-lg py-4 rounded-[20px] hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
