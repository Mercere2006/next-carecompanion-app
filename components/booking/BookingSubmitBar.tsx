import React from "react";
import { formatPrice } from "@/lib/utils";
import { HeartHandshake } from "lucide-react";

interface BookingSubmitBarProps {
  totalPrice: number;
  submitting: boolean;
}

export default function BookingSubmitBar({
  totalPrice,
  submitting,
}: BookingSubmitBarProps) {
  return (
    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div>
        <span className="text-xs text-gray-500 block">
          ยอดรวมทั้งสิ้น (ชำระหลังเสร็จสิ้นภารกิจ)
        </span>
        <span className="text-2xl sm:text-3xl font-black text-emerald-700">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
      >
        <HeartHandshake className="w-5 h-5" />
        {submitting ? "กำลังส่งคำขอ..." : "ยืนยันการส่งคำขอจอง"}
      </button>
    </div>
  );
}
