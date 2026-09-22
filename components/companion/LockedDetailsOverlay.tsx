'use client';

import { Lock, Camera } from 'lucide-react';

interface LockedDetailsOverlayProps {
  faceScanned: boolean;
  onStartFaceScan?: () => void;
}

export default function LockedDetailsOverlay({
  faceScanned,
  onStartFaceScan,
}: LockedDetailsOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-slate-100/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-md mb-3">
        <Lock className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-extrabold text-gray-900">
        ฟอร์มถูกล็อค: ต้องอัปโหลดรูปถ่ายใบหน้าและยืนยันเบอร์โทรศัพท์ก่อน
      </h3>
      <p className="text-xs text-gray-600 max-w-md mt-1 mb-4 leading-relaxed">
        กรุณาทำตาม <strong>ขั้นตอนที่ 1 ด้านบน</strong> (อัปโหลดรูปถ่ายใบหน้า + ยืนยันรหัส OTP เบอร์มือถือ) เมื่อยืนยันผ่านเรียบร้อย ระบบจะปลดล็อคให้คุณเลือกยานพาหนะและเปิดรับงานได้ทันที
      </p>
      {!faceScanned ? (
        <button
          type="button"
          onClick={onStartFaceScan}
          className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-200 transition flex items-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          อัปโหลดรูปถ่ายใบหน้า (ขั้นตอนที่ 1.1)
        </button>
      ) : (
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200">
          กรุณากรอกข้อมูลและยืนยันรหัส OTP ด้านบน
        </span>
      )}
    </div>
  );
}
