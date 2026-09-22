'use client';

import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Camera,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface FaceScanStepProps {
  faceScanned: boolean;
  faceImageUrl: string | null;
  onScanSuccess: (dataUrl: string) => void;
  onResetFace: () => void;
}

export default function FaceScanStep({
  faceScanned,
  faceImageUrl,
  onScanSuccess,
  onResetFace,
}: FaceScanStepProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพใหญ่เกินไป (จำกัดไม่เกิน 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
    };
    reader.onerror = () => {
      setErrorMsg('ไม่สามารถอ่านไฟล์รูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';
  };

  // Confirm selected image
  const handleConfirmImage = () => {
    if (!previewImage) return;
    onScanSuccess(previewImage);
    setPreviewImage(null);
  };

  // Cancel preview
  const handleCancelPreview = () => {
    setPreviewImage(null);
    setErrorMsg('');
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              faceScanned ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
            }`}
          >
            {faceScanned ? '✓' : '1.1'}
          </div>
          <strong className="text-sm font-bold text-gray-900">
            รูปถ่ายใบหน้าจริง (สำหรับยืนยันตัวตน)
          </strong>
        </div>

        {faceScanned && (
          <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> อัปโหลดรูปสำเร็จ
          </span>
        )}
      </div>

      {/* State 1: Image already confirmed/saved */}
      {faceScanned && faceImageUrl ? (
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 overflow-hidden border-2 border-emerald-300 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faceImageUrl}
                alt="Face photo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                รูปถ่ายใบหน้าได้รับการบันทึกแล้ว
              </p>
              <p className="text-[11px] text-gray-500">
                สามารถเปลี่ยนรูปใหม่ได้ หรือดำเนินการต่อในขั้นตอนที่ 1.2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPreviewImage(null);
              onResetFace();
            }}
            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>เปลี่ยนรูปใหม่</span>
          </button>
        </div>
      ) : previewImage ? (
        /* State 2: Selected from gallery - Preview & Confirm */
        <div className="bg-white p-4 rounded-2xl border-2 border-teal-400 space-y-4 shadow-xs">
          <div className="text-center space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              ตรวจสอบรูปถ่ายใบหน้าของคุณ
            </h4>
            <p className="text-[11px] text-gray-500">
              ตรวจสอบว่าเห็นใบหน้าตรงชัดเจน ก่อนกดยืนยันเพื่อใช้เป็นรูปโปรไฟล์
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-teal-200 shadow-md bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelPreview}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              เลือกรูปอื่น
            </button>
            <button
              type="button"
              onClick={handleConfirmImage}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันรูปภาพนี้</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Not yet selected - Gallery upload box */
        <div className="space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border-2 border-dashed border-teal-300 p-6 text-center space-y-4 hover:border-teal-500 transition">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
              <ImageIcon className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900">
                เลือกรูปถ่ายใบหน้าจริงจากแกลลอรี
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                โปรดเลือกรูปถ่ายหน้าตรงที่เห็นใบหน้าของคุณชัดเจน สุภาพ ไม่สวมแว่นตาดำหรือหน้ากาก
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              {/* Gallery upload button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-200 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>เลือกรูปจากแกลลอรี / อุปกรณ์</span>
              </button>

              {/* Camera snap button (for mobile or direct photo) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                <span>ถ่ายภาพด้วยกล้อง</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 pt-1">
              รองรับไฟล์ภาพ JPG, PNG, WEBP (ขนาดไม่เกิน 10MB)
            </p>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
