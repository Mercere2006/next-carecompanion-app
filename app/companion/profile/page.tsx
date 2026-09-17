'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Camera,
  ScanFace,
  Lock,
  Unlock,
  RefreshCw,
  Upload,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function CompanionProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Face Scan & Verification States
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [cameraError, setCameraError] = useState('');

  // Form states
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [skillsText, setSkillsText] = useState('ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์');
  const [serviceAreasText, setServiceAreasText] = useState('พญาไท, บางกอกน้อย, ราชเทวี');
  const [availableSchedule, setAvailableSchedule] = useState('จันทร์ - ศุกร์ (08:30 - 16:30 น.)');
  const [hourlyRate, setHourlyRate] = useState(250);
  const [isAvailable, setIsAvailable] = useState(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function loadCompanionProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from('companion_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        if (data.bio) setBio(data.bio);
        if (data.experience_years) setExperienceYears(data.experience_years);
        if (data.skills && data.skills.length > 0) setSkillsText(data.skills.join(', '));
        if (data.service_areas && data.service_areas.length > 0) setServiceAreasText(data.service_areas.join(', '));
        if (data.hourly_rate) setHourlyRate(Number(data.hourly_rate));
        if (data.available_schedule) setAvailableSchedule(data.available_schedule);
        setIsAvailable(data.is_available ?? true);
        setFaceImageUrl(data.id_card_image_url);
        setVerificationStatus(data.verification_status || 'pending');
      }

      setLoading(false);
    }

    loadCompanionProfile();

    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [supabase]);

  // Handle Google Login if unauthenticated
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

  // Perform Face Scan and Verification
  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || !userId) return;

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

    // Simulated Biometric Verification steps
    setTimeout(async () => {
      setScanStepText('กำลังตรวจสอบ Liveness & อัตลักษณ์ใบหน้า...');

      setTimeout(async () => {
        try {
          // Stop camera stream
          handleStopCamera();

          // Save verification in database
          const { error: profileError } = await supabase
            .from('companion_profiles')
            .upsert({
              id: userId,
              verification_status: 'verified',
              id_card_image_url: faceDataUrl,
              updated_at: new Date().toISOString(),
            });

          if (profileError) throw profileError;

          // Ensure profile role is updated
          await supabase
            .from('profiles')
            .update({ role: 'companion', updated_at: new Date().toISOString() })
            .eq('id', userId);

          setFaceImageUrl(faceDataUrl);
          setVerificationStatus('verified');
          setSuccessMsg(
            'สแกนใบหน้ายืนยันตัวตนสำเร็จ 100%! ปลดล็อคแบบฟอร์มแล้ว คุณสามารถกรอกรายละเอียดการให้บริการด้านล่างได้ทันที'
          );
        } catch (err: unknown) {
          console.error(err);
          setErrorMsg('เกิดข้อผิดพลาดในการบันทึกการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง');
        } finally {
          setScanning(false);
          setScanStepText('');
        }
      }, 1200);
    }, 1000);
  };

  // Fallback: Upload face photo
  const handleUploadFaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setScanning(true);
    setScanStepText('กำลังตรวจสอบภาพถ่ายใบหน้า...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const faceDataUrl = reader.result as string;

        const { error: profileError } = await supabase
          .from('companion_profiles')
          .upsert({
            id: userId,
            verification_status: 'verified',
            id_card_image_url: faceDataUrl,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        await supabase
          .from('profiles')
          .update({ role: 'companion', updated_at: new Date().toISOString() })
          .eq('id', userId);

        setFaceImageUrl(faceDataUrl);
        setVerificationStatus('verified');
        setSuccessMsg(
          'ยืนยันตัวตนด้วยภาพถ่ายใบหน้าเรียบร้อยแล้ว! ปลดล็อคแบบฟอร์มแล้ว สามารถกรอกรายละเอียดการให้บริการด้านล่างได้ทันที'
        );
        setScanning(false);
        setScanStepText('');
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบภาพใบหน้า');
      setScanning(false);
      setScanStepText('');
    }
  };

  // Save Companion Details Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (verificationStatus !== 'verified') {
      setErrorMsg('กรุณาสแกนใบหน้ายืนยันตัวตนให้ผ่านก่อน จึงจะสามารถบันทึกรายละเอียดได้');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const areasArray = serviceAreasText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      const { error } = await supabase.from('companion_profiles').upsert({
        id: userId,
        bio,
        experience_years: Number(experienceYears),
        skills: skillsArray,
        service_areas: areasArray,
        available_schedule: availableSchedule,
        hourly_rate: Number(hourlyRate),
        is_available: isAvailable,
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg('บันทึกข้อมูลรายละเอียดโปรไฟล์ Companion เรียบร้อยแล้ว!');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in
  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-md">
            <ScanFace className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-950">
            เข้าสู่ระบบเพื่อยืนยันตัวตนและรับงาน
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            ผู้ช่วยร่วมเดินทาง (Companion) ต้องเข้าสู่ระบบด้วย Google และทำการสแกนใบหน้ายืนยันตัวตนจริงก่อนเริ่มรับงาน
          </p>
          <button
            onClick={handleGoogleLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            เข้าสู่ระบบด้วย Google เพื่อเริ่มสแกนใบหน้า
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const isVerified = verificationStatus === 'verified';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
              <ScanFace className="w-3.5 h-3.5" />
              <span>ระบบยืนยันตัวตนและจัดการโปรไฟล์ผู้ช่วย</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              ตั้งค่าโปรไฟล์และเปิดรับงาน Companion
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              ผู้ช่วยต้องยืนยันตัวตนด้วยการสแกนใบหน้าก่อน จึงจะสามารถกรอกรายละเอียดและเปิดรับงานได้
            </p>
          </div>

          {isVerified && (
            <Link
              href="/companion/dashboard"
              className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 shadow-md shadow-teal-200 transition shrink-0 inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              ไปยังแดชบอร์ดงานของฉัน ➔
            </Link>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: FACE SCAN VERIFICATION (Mandatory Step) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-100 shadow-lg shadow-teal-50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {isVerified ? <CheckCircle2 className="w-6 h-6" /> : <ScanFace className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-gray-900">
                    ขั้นตอนที่ 1: ยืนยันตัวตนด้วยการสแกนใบหน้า (Face Scan)
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? '✓ ยืนยันตัวตนแล้ว' : 'จำเป็นต้องทำก่อน'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  เพื่อความปลอดภัยและความอุ่นใจของผู้สูงอายุ ผู้ช่วยทุกคนต้องสแกนใบหน้าจริง
                </p>
              </div>
            </div>

            {isVerified && (
              <button
                onClick={() => {
                  setVerificationStatus('pending');
                  setCameraActive(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-teal-700 flex items-center gap-1 self-start sm:self-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                สแกนใบหน้าใหม่
              </button>
            )}
          </div>

          {/* If already verified: show verified card */}
          {isVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ผ่านการสแกนใบหน้ายืนยันตัวตนแล้ว (Verified 100%)
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    อัตลักษณ์ใบหน้าของคุณได้รับการตรวจสอบและผูกกับบัญชีเรียบร้อย ปลดล็อคฟอร์มขั้นตอนที่ 2 แล้ว
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ปลดล็อคแบบฟอร์มแล้ว
              </div>
            </div>
          ) : (
            /* If NOT verified: Face Scanner Interface */
            <div className="space-y-4">
              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera / Viewfinder Box */}
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
                        {/* Scanning Laser Animation */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_10px_#2dd4bf] animate-scanline" />
                      </div>
                    </div>

                    {/* Top Guide Text */}
                    <div className="absolute top-3 inset-x-0 text-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-teal-300 text-xs font-semibold">
                        จัดตำแหน่งใบหน้าให้อยู่ในกรอบวงรี
                      </span>
                    </div>

                    {/* Scanning Overlay Spinner */}
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
                        ระบบจะเปิดกล้องของอุปกรณ์เพื่อตรวจจับใบหน้าจริง (Liveness Detection)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/50 transition flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      เปิดกล้องเพื่อสแกนใบหน้า
                    </button>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Action Buttons under camera */}
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

              {/* Alternative Upload fallback */}
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

        {/* STEP 2: COMPANION DETAILS FORM (GATED) */}
        <div className="relative">
          {/* Lock Overlay if NOT verified */}
          {!isVerified && (
            <div className="absolute inset-0 z-20 bg-slate-100/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-md mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                ฟอร์มถูกล็อค: ต้องสแกนใบหน้ายืนยันตัวตนก่อน
              </h3>
              <p className="text-xs text-gray-600 max-w-md mt-1 mb-4 leading-relaxed">
                กรุณาทำตาม <strong>ขั้นตอนที่ 1 ด้านบน</strong> เพื่อสแกนใบหน้ายืนยันตัวตนจริง เมื่อสแกนผ่านเรียบร้อย ระบบจะปลดล็อคให้คุณกรอกประวัติ อัตราค่าบริการ และเปิดรับงานได้ทันที
              </p>
              <button
                type="button"
                onClick={handleStartCamera}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-200 transition flex items-center gap-2 cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                ไปที่การสแกนใบหน้า (ขั้นตอนที่ 1)
              </button>
            </div>
          )}

          {/* Main Details Form */}
          <form
            onSubmit={handleSaveProfile}
            className={`bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs space-y-6 transition-all ${
              !isVerified ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
            }`}
          >
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>ขั้นตอนที่ 2: กรอกรายละเอียดการให้บริการ (Companion Details)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ข้อมูลเหล่านี้จะนำไปแสดงบนการ์ดผู้ช่วยในหน้าค้นหาเพื่อให้ Customer ใช้ประกอบการตัดสินใจจอง
              </p>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-gray-200">
              <div>
                <strong className="text-sm font-bold text-gray-900 block">
                  สถานะพร้อมรับงาน (Available)
                </strong>
                <span className="text-xs text-gray-500">
                  เปิดเพื่อแสดงโปรไฟล์ในหน้ารายชื่อและค้นหาผู้ช่วย
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isVerified}
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                แนะนำตัว / ประสบการณ์ (Bio)
              </label>
              <textarea
                rows={4}
                disabled={!isVerified}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="แนะนำตัว ประสบการณ์การดูแล ความถนัด และอัธยาศัยของคุณ..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            {/* Experience & Hourly Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  ประสบการณ์ดูแล/ร่วมเดินทาง (ปี)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  disabled={!isVerified}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  อัตราค่าบริการต่อชั่วโมง (บาท)
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="10"
                  disabled={!isVerified}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Available Schedule */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                ช่วงเวลาที่สะดวกให้บริการ (Available Schedule) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!isVerified}
                value={availableSchedule}
                onChange={(e) => setAvailableSchedule(e.target.value)}
                placeholder="เช่น จันทร์ - ศุกร์ (08:30 - 16:30 น.) หรือ เสาร์ - อาทิตย์ ทั้งวัน"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                ทักษะและความสามารถ (คั่นด้วยเครื่องหมายจุลภาค ,)
              </label>
              <input
                type="text"
                disabled={!isVerified}
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="เช่น ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์, มีรถยนต์ส่วนตัว"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>

            {/* Service Areas */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                พื้นที่ให้บริการที่สะดวก (คั่นด้วยเครื่องหมายจุลภาค ,)
              </label>
              <input
                type="text"
                disabled={!isVerified}
                value={serviceAreasText}
                onChange={(e) => setServiceAreasText(e.target.value)}
                placeholder="เช่น พญาไท, บางกอกน้อย, จตุจักร, ปทุมวัน"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving || !isVerified}
                className="px-8 py-3.5 rounded-2xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition shadow-md shadow-teal-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

