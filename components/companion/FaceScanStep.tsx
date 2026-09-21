'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ScanFace,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
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
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
        'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้องในเบราว์เซอร์ หรือเลือกวิธีอัปโหลดภาพถ่ายใบหน้าแทน'
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
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    setScanStepText('กำลังจับภาพและประมวลผลโครงหน้า...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const faceDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setTimeout(() => {
      setScanStepText('กำลังตรวจสอบ Liveness & อัตลักษณ์ใบหน้า...');

      setTimeout(() => {
        handleStopCamera();
        setScanning(false);
        setScanStepText('');
        onScanSuccess(faceDataUrl);
      }, 1000);
    }, 800);
  };

  // Fallback: Upload face photo
  const handleUploadFaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanStepText('กำลังตรวจสอบภาพถ่ายใบหน้า...');

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const faceDataUrl = reader.result as string;
        setScanning(false);
        setScanStepText('');
        onScanSuccess(faceDataUrl);
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error(err);
      setCameraError('เกิดข้อผิดพลาดในการตรวจสอบภาพใบหน้า');
      setScanning(false);
      setScanStepText('');
    }
  };

  // Simulation mode
  const handleSimulation = () => {
    setScanning(true);
    setScanStepText('กำลังจำลองตรวจจับใบหน้าจริง & Liveness...');
    setTimeout(() => {
      setScanning(false);
      setScanStepText('');
      onScanSuccess('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80');
    }, 800);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
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
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 overflow-hidden border border-emerald-300 shrink-0">
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
              <p className="text-xs font-bold text-gray-900">อัตลักษณ์ใบหน้าได้รับการบันทึกแล้ว</p>
              <p className="text-[11px] text-gray-500">กรุณาระบุข้อมูลและยืนยันเบอร์โทรศัพท์ด้านล่าง</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStopCamera();
              onResetFace();
            }}
            className="text-xs text-teal-700 font-semibold hover:underline cursor-pointer"
          >
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

                {scanning && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 p-4 text-center">
                    <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <strong className="text-sm font-bold text-teal-300">
                      {scanStepText || 'กำลังสแกนใบหน้า...'}
                    </strong>
                    <p className="text-xs text-gray-300">กรุณาอยู่นิ่งๆ สักครู่</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                  <ScanFace className="w-8 h-8" />
                </div>
                <div>
                  <strong className="text-sm font-bold text-white block">
                    พร้อมเริ่มสแกนใบหน้า
                  </strong>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    ระบบจะเปิดกล้องของอุปกรณ์เพื่อตรวจจับใบหน้าจริง
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    เปิดกล้องเพื่อสแกนใบหน้า
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulation}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-teal-500/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    จำลองสแกนใบหน้า (Simulation)
                  </button>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

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

          {!cameraActive && (
            <div className="text-center pt-2">
              <label className="cursor-pointer text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>หรือถ่ายภาพ / อัปโหลดรูปถ่ายใบหน้าตรงจากอุปกรณ์</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleUploadFaceFile}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
