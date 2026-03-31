import { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { FolderOpen } from "lucide-react";

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  emptyTitle = "Belum ada data",
  emptySubtitle = "Data akan muncul di sini saat tersedia."
}: DataTableProps<T>) {

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-[24px] border border-gray-100">
        <EmptyState icon={FolderOpen} title={emptyTitle} description={emptySubtitle} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
      <div className="min-w-[700px] border border-gray-100 bg-white rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-4 px-5 text-xs font-black text-gray-500 uppercase tracking-wider ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item, rowIdx) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${col.key}`}
                    className={`py-4 px-5 align-middle ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    }`}
                  >
                    {col.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
