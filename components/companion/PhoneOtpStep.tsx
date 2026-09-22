'use client';

import { useState, useEffect } from 'react';
import {
  Phone,
  User,
  Send,
  Sparkles,
  KeyRound,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface PhoneOtpStepProps {
  faceScanned: boolean;
  phoneVerified: boolean;
  titlePrefix: 'นาย' | 'นาง' | 'นางสาว';
  setTitlePrefix: (val: 'นาย' | 'นาง' | 'นางสาว') => void;
  rawName: string;
  setRawName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  onVerifySuccess: () => Promise<void> | void;
}

export default function PhoneOtpStep({
  faceScanned,
  phoneVerified,
  titlePrefix,
  setTitlePrefix,
  rawName,
  setRawName,
  phone,
  setPhone,
  onVerifySuccess,
}: PhoneOtpStepProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Send OTP
  const handleSendOtp = () => {
    setOtpError('');
    if (!rawName.trim()) {
      setOtpError('กรุณาระบุชื่อและนามสกุลจริงของคุณก่อนขอรหัส OTP');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('0')) {
      setOtpError('เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 เท่านั้น (เช่น 0812345678)');
      return;
    }
    if (cleanPhone.length !== 10) {
      setOtpError('กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก (ขึ้นต้นด้วย 0)');
      return;
    }

    // Generate simulated 6-digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generatedOtp);
    setOtpSent(true);
    setOtpCountdown(60);
    setOtpInput('');
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otpInput.trim() || otpInput.trim() !== otpCode.trim()) {
      setOtpError('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      return;
    }

    setVerifying(true);
    try {
      await onVerifySuccess();
    } catch {
      setOtpError('เกิดข้อผิดพลาดในการยืนยันรหัส OTP กรุณาลองใหม่อีกครั้ง');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        !faceScanned
          ? 'bg-gray-50 border-gray-200 opacity-60 pointer-events-none'
          : 'bg-teal-50/40 border-teal-200 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              phoneVerified ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
            }`}
          >
            {phoneVerified ? '✓' : <Phone className="w-3.5 h-3.5 text-white" />}
          </div>
          <strong className="text-sm font-bold text-gray-900">
            กรอกข้อมูลและยืนยันเบอร์โทรศัพท์ด้วยรหัส OTP
          </strong>
        </div>

        {!faceScanned && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> รอสแกนใบหน้าก่อน
          </span>
        )}
      </div>

      {otpError && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{otpError}</span>
        </div>
      )}

      <div className="space-y-4 max-w-md">
        {/* Full Name Input with Title Prefix */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>ชื่อ - นามสกุล (แสดงบนโปรไฟล์ผู้ช่วย)</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={titlePrefix}
              onChange={(e) => setTitlePrefix(e.target.value as 'นาย' | 'นาง' | 'นางสาว')}
              aria-label="คำนำหน้า"
              className="w-24 sm:w-28 px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shrink-0"
            >
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
            <input
              type="text"
              value={rawName}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, '');
                setRawName(cleaned);
              }}
              placeholder="เช่น สมชาย บริรักษ์ หรือ วิมล สุขเกษม"
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            *โปรดระบุชื่อ-นามสกุลจริงเพื่อความปลอดภัยและการยืนยันตัวตน
          </p>
        </div>

        {/* Phone Input & Send OTP Button */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>เบอร์โทรศัพท์มือถือที่ติดต่อได้จริง</span>
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              disabled={otpSent && otpCountdown > 0}
              value={phone}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 10) val = val.slice(0, 10);
                setPhone(val);
              }}
              placeholder="เช่น 0812345678"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpCountdown > 0 || !phone.trim()}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-gray-300 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {otpSent && otpCountdown > 0 ? `ส่งใหม่ (${otpCountdown}s)` : 'ขอรหัส OTP'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            *เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 เท่านั้น (10 หลัก) เพื่อความเป็นส่วนตัว เบอร์โทรจะแสดงให้เฉพาะลูกค้าที่เข้าสู่ระบบแล้วเท่านั้น
          </p>
        </div>

        {/* Simulated SMS OTP Notice */}
        {otpSent && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                [จำลอง SMS] รหัส OTP ของคุณคือ:
              </span>
              <strong className="text-base font-mono tracking-wider text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded">
                {otpCode}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800 pt-1">
              <span>(รหัสหมดอายุใน 5 นาที)</span>
              <button
                type="button"
                onClick={() => setOtpInput(otpCode)}
                className="font-bold underline text-emerald-900 hover:text-emerald-700 cursor-pointer"
              >
                กรอกรหัสนี้อัตโนมัติ
              </button>
            </div>
          </div>
        )}

        {/* OTP Entry */}
        {otpSent && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>กรอกรหัส OTP 6 หลักที่ได้รับ</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="เช่น 123456"
                className="w-40 px-4 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-center tracking-widest text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifying}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                {verifying ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
