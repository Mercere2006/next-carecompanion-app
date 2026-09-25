"use client";

import { LogIn, X, HeartHandshake } from "lucide-react";
import { CompanionCardData } from "@/types/database";

interface LoginRequiredModalProps {
  companion: CompanionCardData;
  onClose: () => void;
  onGoogleLogin: () => void;
}

export default function LoginRequiredModal({
  companion,
  onClose,
  onGoogleLogin,
}: LoginRequiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-gray-100 space-y-5 sm:space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <LogIn className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">
            เข้าสู่ระบบก่อนดำเนินการจอง
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            กรุณาเข้าสู่ระบบด้วย Google
            เพื่อยืนยันตัวตนและความปลอดภัยในการนัดหมายผู้ช่วยร่วมเดินทาง
          </p>
        </div>

        {/* Selected Companion Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0">
            {companion.profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companion.profile.avatar_url}
                alt={companion.profile.full_name || "Companion"}
                className="w-full h-full object-cover"
              />
            ) : (
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs text-gray-500 font-medium">
              ผู้ช่วยที่คุณเลือก:
            </p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {companion.profile?.full_name}
            </p>
            <p className="text-xs text-emerald-700 font-bold">
              ฿{companion.hourly_rate}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-98 cursor-pointer"
          >
            <svg
              className="w-5 h-5 bg-white rounded-full p-0.5"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            เข้าสู่ระบบด้วย Google เพื่อจอง
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-500 font-semibold hover:text-gray-800 transition cursor-pointer"
          >
            ไว้คราวหลัง
          </button>
        </div>
      </div>
    </div>
  );
}
