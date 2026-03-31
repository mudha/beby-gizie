export function CurrencyText({ amount, className = "" }: { amount: number; className?: string }) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Ganti Rp15.000 menjadi Rp 15.000 (tambah spasi setelah Rp) untuk keterbacaan
  const display = formatted.replace("Rp", "Rp ");

  return <span className={className}>{display}</span>;
}
