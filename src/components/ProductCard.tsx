"use client";
import { Product } from "@/types";
import { CurrencyText } from "./ui/CurrencyText";
import { Minus, Plus, Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  price: number;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function ProductCard({
  product,
  price,
  quantity,
  onIncrease,
  onDecrease,
}: ProductCardProps) {
  return (
    <div
      className={`bg-white rounded-3xl p-4 transition-all duration-300 border-2 ${
        quantity > 0
          ? "border-emerald-600 shadow-lg shadow-emerald-100/50 scale-[1.02] z-10 relative"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Ikon Produk */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
          quantity > 0 ? "bg-emerald-600 text-white shadow-inner" : "bg-emerald-50 text-emerald-500"
        }`}>
          <Package size={28} strokeWidth={1.5} />
        </div>

        {/* Info Produk */}
        <div className="flex-1 min-w-0 py-1">
          <p className="font-bold text-gray-800 text-base mb-1 truncate">{product.name}</p>
          <CurrencyText amount={price} className={`font-black tracking-tight ${quantity > 0 ? "text-emerald-700 text-lg" : "text-gray-500 text-base"}`} />
        </div>

        {/* Kontrol Jumlah */}
        <div className="flex items-center bg-gray-50/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-1 gap-1 shrink-0 shadow-inner">
          <button
            onClick={onDecrease}
            disabled={quantity === 0}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all disabled:opacity-30 disabled:text-gray-400 bg-white text-gray-600 shadow-sm border border-gray-100 hover:border-gray-300 hover:text-emerald-700 hover:shadow active:scale-90"
          >
            <Minus size={22} strokeWidth={2.5} />
          </button>
          
          <div className="w-8 text-center font-black text-gray-800 text-xl font-mono tabular-nums">
            {quantity}
          </div>

          <button
            onClick={onIncrease}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all bg-white text-emerald-600 shadow-sm border border-gray-100 hover:border-orange-300 hover:text-emerald-700 hover:shadow active:scale-90"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* Subtotal Info */}
      {quantity > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between items-center text-sm font-semibold text-emerald-700 bg-emerald-50/50 -mx-4 -mb-4 p-4 rounded-b-3xl">
          <span className="text-emerald-700/70">{quantity} &times; <CurrencyText amount={price} /></span>
          <CurrencyText amount={price * quantity} className="text-base" />
        </div>
      )}
    </div>
  );
}
