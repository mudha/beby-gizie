import React, { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";

interface FilterBarProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function FilterBar({ title = "Filter Data", children, defaultOpen = false }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Filter size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-700 text-sm">{title}</span>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
