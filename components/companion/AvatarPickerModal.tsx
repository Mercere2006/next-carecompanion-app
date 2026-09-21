'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface AvatarPickerModalProps {
  currentAvatarUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAvatar: (dataUrl: string) => void;
}

export default function AvatarPickerModal({
  currentAvatarUrl,
  isOpen,
  onClose,
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const [mode, setMode] = useState<'menu' | 'camera' | 'preview'>('menu');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when closing or unmounting
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('menu');
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้องโดยตรง กรุณาใช้กล้องของระบบ');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ไม่สามารถเข้าถึงกล้องได้';
      setCameraError(errMsg);
    }
  };

  // Capture Photo from Live Camera
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop to square
    const size = Math.min(canvas.width, canvas.height);
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;

    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = 400;
    squareCanvas.height = 400;
    const sqCtx = squareCanvas.getContext('2d');
    if (!sqCtx) return;

    // Flip horizontal for mirror effect
    sqCtx.translate(400, 0);
    sqCtx.scale(-1, 1);
    sqCtx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    const dataUrl = squareCanvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setCapturedImage(dataUrl);
    setMode('preview');
  };

  // Handle File upload (Gallery or mobile camera fallback)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (!rawResult) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 400, 400);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedImage(compressed);
        } else {
          setCapturedImage(rawResult);
        }
        setMode('preview');
      };
      img.onerror = () => {
        setCapturedImage(rawResult);
        setMode('preview');
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Confirm selection
  const handleConfirm = () => {
    if (capturedImage) {
      onSelectAvatar(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1 pt-1">
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-950">
            เปลี่ยนรูปโปรไฟล์
          </h3>
          <p className="text-xs text-gray-500">
            รูปภาพโปรไฟล์ที่คมชัดและเป็นมิตร จะช่วยเพิ่มความน่าเชื่อถือให้กับผู้รับบริการ
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={mobileCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* MODE 1: Menu Selection */}
        {mode === 'menu' && (
          <div className="space-y-4">
            {/* Current avatar preview */}
            <div className="flex justify-center py-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md bg-emerald-50 flex items-center justify-center">
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-10 h-10 text-emerald-600" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Option 1: Live Camera */}
              <button
                type="button"
                onClick={startCamera}
                className="p-4 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-sm text-gray-900 block">ถ่ายรูปด้วยกล้อง</span>
                  <span className="text-[11px] text-gray-500">เปิดกล้องถ่ายภาพทันที</span>
                </div>
              </button>

              {/* Option 2: Gallery / Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-teal-100 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 transition flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-sm text-gray-900 block">เลือกจากแกลเลอรี</span>
                  <span className="text-[11px] text-gray-500">อัปโหลดรูปจากเครื่อง</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Live Camera Capture */}
        {mode === 'camera' && (
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">{cameraError}</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  คุณสามารถใช้กล้องผ่านระบบของมือถือ/อุปกรณ์แทนได้
                </p>
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  เปิดกล้องของอุปกรณ์
                </button>
              </div>
            ) : (
              <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border-4 border-emerald-300 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!streaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs">
                    กำลังเปิดกล้อง...
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-white/40 rounded-full m-4 pointer-events-none" />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode('menu');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                ย้อนกลับ
              </button>

              {streaming && (
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-200 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  กดถ่ายภาพ
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 3: Image Preview & Confirm */}
        {mode === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="flex justify-center py-2">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>

            <p className="text-center text-xs text-gray-600 font-medium">
              ต้องการใช้รูปภาพนี้เป็นรูปโปรไฟล์ใช่หรือไม่?
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setMode('menu');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เลือกรูปใหม่
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                ยืนยันใช้รูปนี้
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
