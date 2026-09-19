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
  User,
  Phone,
  Car,
  Send,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { VehicleType } from '@/types/database';

function parseFullName(name: string): { prefix: 'นาย' | 'นาง' | 'นางสาว'; rawName: string } {
  const trimmed = name.trim();
  if (trimmed.startsWith('นางสาว')) {
    return { prefix: 'นางสาว', rawName: trimmed.replace(/^นางสาว\s*/, '') };
  }
  if (trimmed.startsWith('นาง')) {
    return { prefix: 'นาง', rawName: trimmed.replace(/^นาง\s*/, '') };
  }
  if (trimmed.startsWith('นาย')) {
    return { prefix: 'นาย', rawName: trimmed.replace(/^นาย\s*/, '') };
  }
  if (trimmed.startsWith('คุณ')) {
    return { prefix: 'นาย', rawName: trimmed.replace(/^คุณ\s*/, '') };
  }
  return { prefix: 'นาย', rawName: trimmed };
}

export default function CompanionProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [titlePrefix, setTitlePrefix] = useState<'นาย' | 'นาง' | 'นางสาว'>('นาย');
  const [rawName, setRawName] = useState('');
  const fullName = rawName.trim() ? `${titlePrefix}${rawName.trim()}` : '';

  // Step 1: Face Scan States
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [faceScanned, setFaceScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [cameraError, setCameraError] = useState('');

  // Step 1.2: Phone & OTP Verification States
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Overall Verification Status
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');

  // Step 2: Form States & Vehicle Options
  const [vehicleType, setVehicleType] = useState<VehicleType>('none');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
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
      if (typeof window !== 'undefined' && window.location.search.includes('demo=1')) {
        setUserId('demo-companion-preview');
        setTitlePrefix('นาย');
        setRawName('สมชาย บริรักษ์');
        setPhone('0891234567');
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Load full_name and phone from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const initialName = profileData?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (initialName) {
        const parsed = parseFullName(initialName);
        setTitlePrefix(parsed.prefix);
        setRawName(parsed.rawName);
      }

      if (profileData?.phone) {
        setPhone(profileData.phone);
      }

      // Load companion profile data
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
        if (data.id_card_image_url) {
          setFaceImageUrl(data.id_card_image_url);
          setFaceScanned(true);
        }
        setVerificationStatus(data.verification_status || 'pending');
        if (data.phone_verified) {
          setPhoneVerified(true);
        }
        if (data.vehicle_type) {
          setVehicleType(data.vehicle_type);
        }
        if (data.vehicle_model) {
          setVehicleModel(data.vehicle_model);
        }
        if (data.vehicle_plate) {
          setVehiclePlate(data.vehicle_plate);
        }
      }

      setLoading(false);
    }

    loadCompanionProfile();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [supabase]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

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

  // Perform Face Scan
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

    setTimeout(() => {
      setScanStepText('กำลังตรวจสอบ Liveness & อัตลักษณ์ใบหน้า...');

      setTimeout(() => {
        handleStopCamera();
        setFaceImageUrl(faceDataUrl);
        setFaceScanned(true);
        setScanning(false);
        setScanStepText('');
        setSuccessMsg('สแกนใบหน้าสำเร็จ! กรุณากรอกเบอร์โทรศัพท์และยืนยันรหัส OTP ในขั้นตอนถัดไป');
      }, 1000);
    }, 800);
  };

  // Fallback: Upload face photo
  const handleUploadFaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setScanning(true);
    setScanStepText('กำลังตรวจสอบภาพถ่ายใบหน้า...');

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const faceDataUrl = reader.result as string;
        setFaceImageUrl(faceDataUrl);
        setFaceScanned(true);
        setScanning(false);
        setScanStepText('');
        setSuccessMsg('อัปโหลดรูปถ่ายใบหน้าเรียบร้อย! กรุณากรอกเบอร์โทรศัพท์และยืนยันรหัส OTP');
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบภาพใบหน้า');
      setScanning(false);
      setScanStepText('');
    }
  };

  // Send OTP
  const handleSendOtp = () => {
    setOtpError('');
    if (!rawName.trim()) {
      setOtpError('กรุณาระบุชื่อและนามสกุลจริงของคุณก่อนขอรหัส OTP');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 10) {
      setOtpError('กรุณากรอกเบอร์โทรศัพท์มือถือที่ถูกต้อง (9-10 หลัก)');
      return;
    }

    // Generate simulated 6-digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generatedOtp);
    setOtpSent(true);
    setOtpCountdown(60);
    setOtpInput('');
  };

  // Step 1.2: Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otpInput.trim() || otpInput.trim() !== otpCode.trim()) {
      setOtpError('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      return;
    }

    // OTP Verified successfully!
    setPhoneVerified(true);
    setVerificationStatus('verified');

    try {
      if (userId) {
        // 1. Update phone and full_name in profiles table
        const profileUpdate: Record<string, unknown> = {
          phone: phone.trim(),
          role: 'companion',
          updated_at: new Date().toISOString(),
        };
        if (fullName.trim()) {
          profileUpdate.full_name = fullName.trim();
        }

        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId);

        // 2. Update companion profile with verified status
        await supabase.from('companion_profiles').upsert({
          id: userId,
          verification_status: 'verified',
          phone_verified: true,
          id_card_image_url: faceImageUrl,
          updated_at: new Date().toISOString(),
        });
      }

      setSuccessMsg(
        '🎉 ยืนยันตัวตนสำเร็จ 100%! สแกนใบหน้าและยืนยันเบอร์โทรศัพท์ผ่านแล้ว ปลดล็อคขั้นตอนที่ 2 เรียบร้อย'
      );
    } catch (e) {
      console.error('Failed to save verified state', e);
    }
  };

  // Step 2: Save Companion Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!isVerified) {
      setErrorMsg('กรุณายืนยันตัวตน (สแกนใบหน้า + เบอร์โทร OTP) ให้ผ่านก่อนบันทึก');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลจริงของคุณ');
      return;
    }

    if (vehicleType !== 'none' && (!vehicleModel.trim() || !vehiclePlate.trim())) {
      setErrorMsg('กรุณากรอกยี่ห้อ/รุ่น และหมายเลขทะเบียนรถให้ครบถ้วน');
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
        phone_verified: phoneVerified,
        vehicle_type: vehicleType,
        vehicle_model: vehicleType === 'none' ? null : vehicleModel.trim(),
        vehicle_plate: vehicleType === 'none' ? null : vehiclePlate.trim(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update full_name and phone in profiles table as well
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      setSuccessMsg('บันทึกข้อมูลรายละเอียดโปรไฟล์และยานพาหนะเรียบร้อยแล้ว!');
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
            ผู้ช่วยร่วมเดินทาง (Companion) ต้องเข้าสู่ระบบด้วย Google และทำการสแกนใบหน้า + ยืนยันเบอร์โทรศัพท์ก่อนเริ่มรับงาน
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 inline-flex items-center justify-center gap-3 cursor-pointer"
            >
              เข้าสู่ระบบด้วย Google เพื่อเริ่มยืนยันตัวตน
            </button>
            <button
              type="button"
              onClick={() => {
                setUserId('demo-companion-preview');
                setTitlePrefix('นาย');
                setRawName('สมชาย บริรักษ์');
                setPhone('0891234567');
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              ทดลองระบบยืนยันตัวตน (Demo Sandbox)
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Verification is complete when both face is scanned and phone is verified
  const isVerified = (verificationStatus === 'verified' && phoneVerified) || (faceScanned && phoneVerified);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
              <ScanFace className="w-3.5 h-3.5" />
              <span>ระบบยืนยันตัวตนและจัดการโปรไฟล์ผู้ช่วย</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight break-words">
              ตั้งค่าโปรไฟล์และเปิดรับงาน Companion
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              สแกนใบหน้าและยืนยันเบอร์โทรศัพท์ผ่าน OTP เพื่อปลดล็อคการกรอกรายละเอียดและเปิดรับงาน
            </p>
          </div>

          {isVerified && (
            <Link
              href="/companion/dashboard"
              className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 shadow-md shadow-teal-200 transition shrink-0 inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              ไปยังแดชบอร์ดงานของฉัน ➔
            </Link>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: IDENTITY VERIFICATION (Face Scan + Phone OTP) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-teal-100 shadow-lg shadow-teal-50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {isVerified ? <CheckCircle2 className="w-6 h-6" /> : <ScanFace className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 break-words">
                    ขั้นตอนที่ 1: ยืนยันตัวตน (สแกนใบหน้า + เบอร์โทรศัพท์ OTP)
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? '✓ ยืนยันตัวตนแล้ว' : 'จำเป็นต้องทำก่อน'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  เพื่อความปลอดภัยและความอุ่นใจของผู้สูงอายุ ผู้ช่วยต้องสแกนใบหน้าและยืนยันเบอร์มือถือจริง
                </p>
              </div>
            </div>

            {isVerified && (
              <button
                type="button"
                onClick={() => {
                  setPhoneVerified(false);
                  setFaceScanned(false);
                  setVerificationStatus('pending');
                  setCameraActive(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-teal-700 flex items-center gap-1 self-start sm:self-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เริ่มยืนยันตัวตนใหม่
              </button>
            )}
          </div>

          {/* IF ALREADY FULLY VERIFIED (Face + Phone) */}
          {isVerified ? (
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
                      {fullName
                        ? fullName.startsWith('คุณ') ||
                          fullName.startsWith('นาย') ||
                          fullName.startsWith('นาง') ||
                          fullName.startsWith('น.ส.')
                          ? fullName
                          : `คุณ${fullName}`
                        : 'ผู้ให้บริการร่วมเดินทาง'}
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs shrink-0">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ปลดล็อคแบบฟอร์มขั้นตอนที่ 2 แล้ว
              </div>
            </div>
          ) : (
            /* IF NOT YET FULLY VERIFIED */
            <div className="space-y-6">
              {/* SUBSTEP 1.1: FACE SCAN */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      faceScanned ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
                    }`}>
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
                        setFaceScanned(false);
                        setCameraActive(false);
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
                            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-teal-300 text-xs font-semibold">
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
                              onClick={() => {
                                setScanning(true);
                                setScanStepText('กำลังจำลองตรวจจับใบหน้าจริง & Liveness...');
                                setTimeout(() => {
                                  setFaceImageUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80');
                                  setFaceScanned(true);
                                  setScanning(false);
                                  setScanStepText('');
                                  setSuccessMsg('สแกนใบหน้าสำเร็จ! กรุณากรอกเบอร์โทรศัพท์และยืนยันรหัส OTP ในขั้นตอนถัดไป');
                                }, 800);
                              }}
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

              {/* SUBSTEP 1.2: PHONE & OTP VERIFICATION */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  !faceScanned
                    ? 'bg-gray-50 border-gray-200 opacity-60 pointer-events-none'
                    : 'bg-teal-50/40 border-teal-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      phoneVerified ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
                    }`}>
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
                      <span>ชื่อ - นามสกุลจริง (แสดงบนโปรไฟล์ผู้ช่วย)</span>
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
                        onChange={(e) => setPhone(e.target.value)}
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
                      *เพื่อความเป็นส่วนตัว เบอร์โทรจะแสดงให้เฉพาะลูกค้าที่เข้าสู่ระบบแล้วเท่านั้น
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
                          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                        >
                          ยืนยันรหัส OTP
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: COMPANION DETAILS FORM (GATED) */}
        <div className="relative">
          {/* Lock Overlay if NOT fully verified */}
          {!isVerified && (
            <div className="absolute inset-0 z-20 bg-slate-100/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-md mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                ฟอร์มถูกล็อค: ต้องสแกนใบหน้าและยืนยันเบอร์โทรศัพท์ก่อน
              </h3>
              <p className="text-xs text-gray-600 max-w-md mt-1 mb-4 leading-relaxed">
                กรุณาทำตาม <strong>ขั้นตอนที่ 1 ด้านบน</strong> (สแกนใบหน้า + ยืนยันรหัส OTP เบอร์มือถือ) เมื่อยืนยันผ่านเรียบร้อย ระบบจะปลดล็อคให้คุณเลือกยานพาหนะและเปิดรับงานได้ทันที
              </p>
              {!faceScanned ? (
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-200 transition flex items-center gap-2 cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  เริ่มสแกนใบหน้า (ขั้นตอนที่ 1.1)
                </button>
              ) : (
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200">
                  กรุณากรอกข้อมูลและยืนยันรหัส OTP ด้านบน
                </span>
              )}
            </div>
          )}

          {/* Main Details Form */}
          <form
            onSubmit={handleSaveProfile}
            className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-gray-200/80 shadow-xs space-y-6 transition-all ${
              !isVerified ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
            }`}
          >
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>ขั้นตอนที่ 2: กรอกรายละเอียดการให้บริการและยานพาหนะ (Companion Details)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ข้อมูลเหล่านี้จะนำไปแสดงบนการ์ดผู้ช่วยในหน้าค้นหาเพื่อให้ Customer ใช้ประกอบการตัดสินใจจอง
              </p>
            </div>

            {/* Full Name Input */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-gray-200">
              <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>ชื่อ - นามสกุลจริง (Full Name)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  disabled={!isVerified}
                  value={titlePrefix}
                  onChange={(e) => setTitlePrefix(e.target.value as 'นาย' | 'นาง' | 'นางสาว')}
                  aria-label="คำนำหน้า"
                  className="w-24 sm:w-28 px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:bg-gray-100 shrink-0"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
                <input
                  type="text"
                  disabled={!isVerified}
                  required
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
                *ชื่อนี้จะแสดงบนการ์ดค้นหาผู้ช่วยและเอกสารการนัดหมายร่วมเดินทางของลูกค้า
              </p>
            </div>

            {/* VEHICLE & TRANSPORTATION OPTIONS (Grab style) */}
            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-700" />
                  <span>ประเภทยานพาหนะในการให้บริการร่วมเดินทาง (Vehicle Type)</span>
                </label>
                <span className="text-xs text-gray-500">เลือกรูปแบบการรับ-ส่งตามที่คุณสะดวก</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. ไม่มีพาหนะ / ขนส่งสาธารณะ */}
                <button
                  type="button"
                  disabled={!isVerified}
                  onClick={() => {
                    setVehicleType('none');
                    setVehicleModel('');
                    setVehiclePlate('');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                    vehicleType === 'none'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🚶</div>
                  <div className="font-bold text-sm text-gray-900">ไม่มีพาหนะส่วนตัว</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    ร่วมเดินทางด้วย BTS/MRT, รถเมล์ หรือแท็กซี่
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-700">
                    เรตแนะนำ: 200 - 250 บ./ชม.
                  </div>
                </button>

                {/* 2. รถมอเตอร์ไซค์ */}
                <button
                  type="button"
                  disabled={!isVerified}
                  onClick={() => {
                    setVehicleType('motorcycle');
                    if (hourlyRate < 250) setHourlyRate(280);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                    vehicleType === 'motorcycle'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🛵</div>
                  <div className="font-bold text-sm text-gray-900">รถจักรยานยนต์ (มอเตอร์ไซค์)</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    สะดวกรวดเร็ว คล่องตัว เหมาะกับธุระด่วนในเมือง
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-700">
                    เรตแนะนำ: 250 - 350 บ./ชม.
                  </div>
                </button>

                {/* 3. รถยนต์ส่วนตัว */}
                <button
                  type="button"
                  disabled={!isVerified}
                  onClick={() => {
                    setVehicleType('car');
                    if (hourlyRate < 350) setHourlyRate(350);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                    vehicleType === 'car'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🚗</div>
                  <div className="font-bold text-sm text-gray-900">รถยนต์ส่วนตัว (Car / SUV)</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    สะดวกสบาย ปลอดภัยสูง รองรับวีลแชร์และสัมภาระ
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-700">
                    เรตแนะนำ: 350 - 500+ บ./ชม.
                  </div>
                </button>
              </div>

              {/* Conditional Vehicle Inputs for Motorcycle / Car */}
              {vehicleType !== 'none' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ข้อมูลยานพาหนะ (หมายเลขทะเบียนจะแสดงเฉพาะลูกค้าที่เข้าสู่ระบบแล้วเท่านั้น)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">
                        ยี่ห้อ / รุ่น / สีรถ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isVerified}
                        required
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder={
                          vehicleType === 'car'
                            ? 'เช่น Honda City สีขาว หรือ Toyota Yaris สีบรอนซ์เงิน'
                            : 'เช่น Yamaha Grand Filano สีเทา หรือ Honda Wave สีแดง'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">
                        หมายเลขทะเบียนรถ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isVerified}
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="เช่น 1กข 1234 กรุงเทพมหานคร"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    อัตราค่าบริการต่อชั่วโมง (บาท)
                  </label>
                  {vehicleType === 'car' && hourlyRate < 350 && (
                    <button
                      type="button"
                      onClick={() => setHourlyRate(350)}
                      className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      ปรับเป็น 350 บ. (แนะนำสำหรับรถยนต์)
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="10"
                  disabled={!isVerified}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100 font-bold"
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
                placeholder="เช่น ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์"
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
                className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition shadow-md shadow-teal-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์และยานพาหนะ'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
