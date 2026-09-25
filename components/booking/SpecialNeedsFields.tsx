import React from "react";
import { QUICK_SPECIAL_NEEDS } from "./constants";

interface SpecialNeedsFieldsProps {
  specialNeeds: string;
  onSpecialNeedsChange: (value: string) => void;
  onQuickNeedTag: (tag: string) => void;
  onClearNeeds: () => void;
}

export default function SpecialNeedsFields({
  specialNeeds,
  onSpecialNeedsChange,
  onQuickNeedTag,
  onClearNeeds,
}: SpecialNeedsFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="block text-sm font-bold text-gray-900">
          6. ความช่วยเหลือพิเศษ (ถ้ามี)
        </label>
        <span className="text-xs text-gray-500">
          เลือกตัวเลือกด้านล่าง หรือพิมพ์ระบุเองได้
        </span>
      </div>
      <input
        type="text"
        value={specialNeeds}
        onChange={(e) => onSpecialNeedsChange(e.target.value)}
        placeholder="เช่น ใช้วีลแชร์ของตนเอง, เดินช้าต้องช่วยพยุง, ต้องการคนมีรถยนต์ส่วนตัว"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
      />
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs text-gray-500 font-medium">
          ตัวเลือกแนะนำ:
        </span>
        {QUICK_SPECIAL_NEEDS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onQuickNeedTag(tag)}
            className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition font-medium cursor-pointer"
          >
            + {tag}
          </button>
        ))}
        {specialNeeds && (
          <button
            type="button"
            onClick={onClearNeeds}
            className="px-2 py-1 text-xs text-rose-600 hover:underline cursor-pointer ml-auto"
          >
            ล้างข้อความ
          </button>
        )}
      </div>
    </div>
  );
}
