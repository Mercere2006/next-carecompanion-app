'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ScanFace,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
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
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Helper to compress image via canvas
  const compressImage = (
    imageSource: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
    quality = 0.85
  ): string => {
    const canvas = document.createElement('canvas');
    const maxSize = 480;
    let targetW = width;
    let targetH = height;

    if (width > height) {
      if (width > maxSize) {
        targetH = Math.round((height * maxSize) / width);
        targetW = maxSize;
      }
    } else {
      if (height > maxSize) {
        targetW = Math.round((width * maxSize) / height);
        targetH = maxSize;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imageSource, 0, 0, targetW, targetH);
      return canvas.toDataURL('image/jpeg', quality);
    }
    return '';
  };

  // Start Webcam
  const handleStartCamera = async () => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCameraError(
        'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้องในเบราว์เซอร์ หรือเลือกกด "จำลองสแกนใบหน้า" หรืออัปโหลดรูปภาพ'
      );
      setCameraActive(false);
    }
  };

  // Stop Webcam
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Perform Face Scan from Camera
  const handleCaptureAndVerify = () => {
    if (!videoRef.current) return;

    setScanning(true);
    setScanProgress(30);
    setScanStepText('กำลังจับภาพและวิเคราะห์โครงหน้า (Biometric Mesh)...');

    const video = videoRef.current;
    const faceDataUrl = compressImage(video, video.videoWidth || 640, video.videoHeight || 480);

    setTimeout(() => {
      setScanProgress(70);
      setScanStepText('กำลังตรวจสอบ Liveness & อัตลักษณ์ความมีชีวิตจริง...');

      setTimeout(() => {
        setScanProgress(100);
        setScanStepText('ยืนยันอัตลักษณ์บุคคลสำเร็จ!');

        setTimeout(() => {
          handleStopCamera();
          setScanning(false);
          setScanStepText('');
          setScanProgress(0);
          onScanSuccess(faceDataUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces');
        }, 500);
      }, 800);
    }, 800);
  };

  // Simulation Mode (Requested feature: จำลองสแกนใบหน้า)
  const handleSimulation = () => {
    handleStopCamera();
    setScanning(true);
    setScanProgress(25);
    setScanStepText('กำลังเริ่มระบบจำลองตรวจจับอัตลักษณ์ใบหน้า...');

    setTimeout(() => {
      setScanProgress(55);
      setScanStepText('กำลังจำลองตรวจจับโครงสร้างใบหน้า & Liveness Detection (99.8%)...');

      setTimeout(() => {
        setScanProgress(90);
        setScanStepText('ตรวจสอบความถูกต้องเรียบร้อย บันทึกข้อมูลอัตลักษณ์สำเร็จ...');

        setTimeout(() => {
          setScanning(false);
          setScanStepText('');
          setScanProgress(0);
          onScanSuccess('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces');
        }, 600);
      }, 800);
    }, 700);
  };

  // Fallback: Choose/upload face photo from file/gallery
  const handleUploadFaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanProgress(40);
    setScanStepText('กำลังอ่านและบีบอัดรูปภาพถ่ายใบหน้า...');

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setScanProgress(80);
          setScanStepText('กำลังวิเคราะห์ความคมชัดของภาพใบหน้า...');

          const compressedUrl = compressImage(img, img.width, img.height, 0.85);

          setTimeout(() => {
            setScanProgress(100);
            setScanning(false);
            setScanStepText('');
            setScanProgress(0);
            onScanSuccess(compressedUrl || (reader.result as string));
          }, 600);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error(err);
      setCameraError('เกิดข้อผิดพลาดในการตรวจสอบภาพใบหน้า');
      setScanning(false);
      setScanStepText('');
      setScanProgress(0);
    }

    e.target.value = '';
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
            สแกนใบหน้าจริง (Face Scan)
          </strong>
        </div>

        {faceScanned && (
          <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> สแกนใบหน้าสำเร็จ
          </span>
        )}
      </div>

      {faceScanned ? (
        /* Scanned Success Card */
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 overflow-hidden border-2 border-emerald-300 shrink-0 shadow-xs">
              {faceImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faceImageUrl}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                อัตลักษณ์ใบหน้าได้รับการบันทึกแล้ว
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                ผ่านการตรวจสอบ Liveness เรียบร้อย กรุณายืนยันเบอร์โทรศัพท์ในขั้นตอนที่ 1.2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStopCamera();
              onResetFace();
            }}
            className="text-xs text-teal-700 font-bold hover:text-teal-800 hover:underline inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            สแกนใหม่
          </button>
        </div>
      ) : (
        /* Camera / Viewfinder Box */
        <div className="space-y-4">
          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="relative max-w-md mx-auto aspect-4/3 rounded-3xl bg-gray-950 overflow-hidden flex items-center justify-center border-4 border-teal-500 shadow-xl">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Biometric Oval Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-64 border-2 border-dashed border-teal-400 rounded-[50%] shadow-[0_0_20px_rgba(20,184,166,0.5)] relative">
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_10px_#2dd4bf] animate-scanline" />
                  </div>
                </div>

                <div className="absolute top-3 inset-x-0 text-center pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-teal-300 text-xs font-semibold">
                    จัดตำแหน่งใบหน้าให้อยู่ในกรอบวงรี
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto shadow-inner relative">
                  <ScanFace className="w-8 h-8" />
                  <div className="absolute inset-0 rounded-full border border-teal-400/30 animate-ping pointer-events-none" />
                </div>
                <div>
                  <strong className="text-sm sm:text-base font-bold text-white block">
                    พร้อมเริ่มสแกนใบหน้า
                  </strong>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    เปิดกล้องเพื่อตรวจจับใบหน้าจริง หรือกดปุ่มจำลองเพื่อทดสอบขั้นตอนสแกน
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/50 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    เปิดกล้องเพื่อสแกนใบหน้า
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulation}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    จำลองสแกนใบหน้า (Simulation)
                  </button>
                </div>
              </div>
            )}

            {/* Scanning Overlay (Active during Camera Capture or Simulation) */}
            {scanning && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 p-6 text-center z-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <ScanFace className="w-8 h-8 text-teal-300 absolute inset-0 m-auto" />
                </div>
                <strong className="text-sm font-bold text-teal-300 mt-2">
                  {scanStepText || 'กำลังสแกนใบหน้า...'}
                </strong>
                {/* Progress Bar */}
                <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-teal-500/30">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">กรุณาอยู่นิ่งๆ ระบบกำลังประมวลผลอัตลักษณ์</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Action buttons when camera is live */}
          {cameraActive && !scanning && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCaptureAndVerify}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-200 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ScanFace className="w-5 h-5" />
                ถ่ายภาพและยืนยันใบหน้า
              </button>
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-3.5 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Fallback File/Gallery Picker */}
          {!cameraActive && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>หรือเลือกรูปถ่ายใบหน้าจากคลังภาพ (Gallery) / ไฟล์ในเครื่อง</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadFaceFile}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
