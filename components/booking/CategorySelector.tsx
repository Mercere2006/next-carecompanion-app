import React from "react";
import { CheckCircle2 } from "lucide-react";
import { SERVICE_CATEGORIES } from "./constants";

interface CategorySelectorProps {
  categoryId: number;
  customCategory?: string;
  onSelectCategory: (id: number, catName?: string) => void;
  onCustomCategoryChange?: (text: string) => void;
}

export default function CategorySelector({
  categoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-900">
        1. ประเภทธุระที่ต้องการใช้บริการ <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id, cat.name)}
            className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition flex items-center justify-between cursor-pointer ${
              categoryId === cat.id
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
            }`}
          >
            <span>{cat.name}</span>
            {categoryId === cat.id && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
