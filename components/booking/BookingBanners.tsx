import React from "react";
import { Sparkles, LogIn, ShieldAlert } from "lucide-react";

interface BookingBannersProps {
  isPrefilled: boolean;
  user: { id: string } | null;
  errorMsg: string;
  onGoogleLogin: () => void;
}

export default function BookingBanners({
  isPrefilled,
  user,
  errorMsg,
  onGoogleLogin,
}: BookingBannersProps) {
  return (
    <div className="space-y-4">
      {/* Prefilled Info Badge */}
      {isPrefilled && (
        <div className="px-4 py-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-2xs">
          <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
          <span>
            <strong>ดึงข้อมูลจากเงื่อนไขที่คุณค้นหาอัตโนมัติ:</strong>{" "}
            คุณสามารถปรับเปลี่ยนหรือเพิ่มเติมข้อมูลในแบบฟอร์มด้านล่างได้ตามต้องการ
          </span>
        </div>
      )}

      {/* Auth Warning Banner if not logged in */}
      {!user && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-gray-900">
                กรุณาเข้าสู่ระบบด้วย Google ก่อนส่งคำขอจอง
              </h4>
              <p className="text-xs text-gray-600">
                ข้อมูลที่คุณกรอกจะถูกเก็บไว้
                และนำคุณกลับมาส่งคำขอต่อหลังเข้าสู่ระบบทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </div>
      )}

      {/* Ethical Disclaimer Warning */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong>คำเตือนด้านความปลอดภัย:</strong> ผู้ช่วย
          มีหน้าที่อำนวยความสะดวกในการเดินทางและช่วยทำธุระเท่านั้น
          ไม่ใช่ผู้ให้บริการทางการแพทย์
          หากผู้เดินทางมีโรคประจำตัวร้ายแรงหรือต้องการการดูแลพยาบาล
          กรุณามีผู้ดูแลหลักร่วมเดินทางด้วย
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
