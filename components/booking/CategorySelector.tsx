import React from "react";
import { CheckCircle2 } from "lucide-react";
import { SERVICE_CATEGORIES } from "./constants";

interface CategorySelectorProps {
  categoryId: number;
  customCategory: string;
  onSelectCategory: (id: number, catName?: string) => void;
  onCustomCategoryChange: (text: string) => void;
}

export default function CategorySelector({
  categoryId,
  customCategory,
  onSelectCategory,
  onCustomCategoryChange,
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

        {/* Custom / Other Category */}
        <button
          type="button"
          onClick={() => onSelectCategory(99)}
          className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition flex items-center justify-between cursor-pointer ${
            categoryId === 99
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
              : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
          }`}
        >
          <span>✏️ อื่นๆ (ระบุเอง)</span>
          {categoryId === 99 && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
        </button>
      </div>

      {categoryId === 99 && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            required
            value={customCategory}
            onChange={(e) => onCustomCategoryChange(e.target.value)}
            placeholder="พิมพ์ระบุประเภทธุระของคุณ เช่น พาไปตัดแว่น, พาไปงานมงคล, ไปตรวจสายตา..."
            className="w-full px-4 py-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      )}
    </div>
  );
}
