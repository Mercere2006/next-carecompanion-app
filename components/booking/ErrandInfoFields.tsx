import React from "react";

interface ErrandInfoFieldsProps {
  errandTitle: string;
  errandDetails: string;
  onTitleChange: (title: string) => void;
  onDetailsChange: (details: string) => void;
}

export default function ErrandInfoFields({
  errandTitle,
  errandDetails,
  onTitleChange,
  onDetailsChange,
}: ErrandInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-900">
          2. หัวข้อธุระ <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={errandTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="เช่น พาคุณแม่ไปตรวจเบาหวานตามนัด รพ.ศิริราช"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-900">
          รายละเอียดเพิ่มเติม
        </label>
        <textarea
          rows={2}
          value={errandDetails}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder="เช่น ต้องเจาะเลือดก่อน 8:30 น., นัดแพทย์ตึกสยามินทร์ ชั้น 4"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
        />
      </div>
    </div>
  );
}
