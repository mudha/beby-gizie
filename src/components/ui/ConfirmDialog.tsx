import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Ya, Konfirmasi",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-slide-up">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-gray-50 font-semibold text-gray-600 hover:bg-gray-100 transition text-sm active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition text-sm active:scale-95 shadow-md shadow-red-200"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
