'use client';

import {
  ShieldCheck,
  ScanFace,
  Phone,
  Unlock,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface VerifiedIdentityBannerProps {
  fullName: string;
  phone: string;
  faceImageUrl: string | null;
  onResetVerification: () => void;
}

export default function VerifiedIdentityBanner({
  fullName,
  phone,
  faceImageUrl,
  onResetVerification,
}: VerifiedIdentityBannerProps) {
  const formattedDisplayName = fullName
    ? fullName.startsWith('คุณ') ||
      fullName.startsWith('นาย') ||
      fullName.startsWith('นาง') ||
      fullName.startsWith('น.ส.') ||
      fullName.startsWith('นางสาว')
      ? fullName
      : `คุณ${fullName}`
    : 'ผู้ให้บริการร่วมเดินทาง';

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-200 border-2 border-emerald-400 overflow-hidden shrink-0">
            {faceImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faceImageUrl}
                alt="Verified Face"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCheck className="w-8 h-8 text-emerald-800 m-auto mt-3" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                {formattedDisplayName}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified 100%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-emerald-800">
              <span className="bg-emerald-100/90 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                <ScanFace className="w-3.5 h-3.5" /> ใบหน้าตรวจสอบแล้ว
              </span>
              <span className="bg-emerald-100/90 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> เบอร์โทร: {phone || 'ยืนยันแล้ว'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs shrink-0">
            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
            ปลดล็อคแบบฟอร์มขั้นตอนที่ 2 แล้ว
          </div>
          <button
            type="button"
            onClick={onResetVerification}
            className="text-xs font-semibold text-gray-500 hover:text-teal-700 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            เริ่มใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
