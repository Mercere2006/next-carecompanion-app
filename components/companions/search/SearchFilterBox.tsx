"use client";

import { ClipboardList, MapPin, Search } from "lucide-react";
import ComboboxSelect from "@/components/ui/ComboboxSelect";
import { CATEGORY_OPTIONS, SPECIAL_NEED_OPTIONS } from "./constants";

interface SearchFilterBoxProps {
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  searchArea: string;
  onAreaChange: (val: string) => void;
  specialNeedFilter: string;
  onSpecialNeedChange: (val: string) => void;
  maxRate: string;
  onMaxRateChange: (val: string) => void;
  searchKeyword: string;
  onSearchKeywordChange: (val: string) => void;
  resultsCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export default function SearchFilterBox({
  selectedCategory,
  onCategoryChange,
  searchArea,
  onAreaChange,
  specialNeedFilter,
  onSpecialNeedChange,
  maxRate,
  onMaxRateChange,
  searchKeyword,
  onSearchKeywordChange,
  resultsCount,
  hasActiveFilters,
  onResetFilters,
}: SearchFilterBoxProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-emerald-100 shadow-xl shadow-emerald-100/40 space-y-5 sm:space-y-6 min-w-0 relative z-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 min-w-0">
        <h3 className="text-xs sm:text-base font-bold text-gray-900 flex items-center gap-2 min-w-0 flex-wrap">
          <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
          <span className="break-words">
            ระบุความต้องการของคุณ (Customer Requirements):
          </span>
        </h3>
      </div>

      {/* 4-Field Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. ประเภทธุระ */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-gray-700">
            1. ประเภทธุระ
          </label>
          <ComboboxSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            options={CATEGORY_OPTIONS}
            placeholder="เลือก หรือพิมพ์ประเภทธุระ..."
          />
        </div>

        {/* 2. พื้นที่ต้นทาง / ปลายทาง */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-gray-700">
            2. พื้นที่ / เขตที่ต้องการ
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="เช่น บางกอกน้อย, พญาไท..."
              value={searchArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* 3. ความต้องการพิเศษ (วีลแชร์ / ช่วยพยุง) */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-gray-700">
            3. ความช่วยเหลือพิเศษ
          </label>
          <ComboboxSelect
            value={specialNeedFilter}
            onChange={onSpecialNeedChange}
            options={SPECIAL_NEED_OPTIONS}
            placeholder="เลือก หรือพิมพ์ความช่วยเหลือ..."
          />
        </div>

        {/* 4. อัตราค่าบริการ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">
            4. งบประมาณ
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs sm:text-sm font-bold text-emerald-700">
              ฿
            </span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="เช่น 300, 500"
              value={maxRate}
              onChange={(e) => onMaxRateChange(e.target.value)}
              className="w-full pl-8 pr-14 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium pointer-events-none">
              บาท
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Search Bar & Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือทักษะเพิ่มเติม..."
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="font-semibold text-gray-700">
            พบผู้ช่วย:{" "}
            <strong className="text-emerald-700 text-sm">
              {resultsCount}
            </strong>{" "}
            ท่าน
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              ล้างค่า
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
