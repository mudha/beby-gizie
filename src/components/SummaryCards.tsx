import { formatRupiah } from "@/lib/format";
import { DashboardSummary } from "@/types";
import { TrendingUp, ShoppingBag, BarChart3 } from "lucide-react";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Penjualan",
      value: formatRupiah(summary.totalAmount),
      icon: TrendingUp,
      color: "orange",
    },
    {
      label: "Jumlah Transaksi",
      value: summary.transactionCount.toString(),
      icon: ShoppingBag,
      color: "green",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatRupiah(summary.avgPerTransaction),
      icon: BarChart3,
      color: "blue",
    },
  ];

  const colorMap: Record<string, string> = {
    orange: "bg-emerald-50 text-emerald-700",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${colorMap[card.color]}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
