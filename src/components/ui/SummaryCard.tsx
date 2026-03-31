import { ReactNode } from "react";
import { CurrencyText } from "./CurrencyText";

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
  colorType?: "orange" | "blue" | "green" | "purple";
}

export function SummaryCard({
  title,
  value,
  icon,
  subtitle,
  isCurrency = false,
  colorType = "orange"
}: SummaryCardProps) {

  const colorStyles = {
    orange: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  }[colorType];

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${colorStyles}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</p>
          <div className="font-black text-gray-900 text-2xl truncate">
            {isCurrency && typeof value === "number" ? (
              <CurrencyText amount={value} />
            ) : (
              <span>{value}</span>
            )}
          </div>
          {subtitle && <p className="text-xs font-semibold text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
