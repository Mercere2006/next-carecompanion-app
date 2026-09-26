'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ScanFace,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Swal from 'sweetalert2';
import { createClient } from '@/lib/supabase/client';
import { parseFullName } from '@/components/companion/utils';
import {
  VehicleEntry,
  parseVehiclesList,
  formatVehiclesToFields,
  extractCleanBio,
  embedBioMetadata,
} from '@/lib/vehicleUtils';
import FaceScanStep from '@/components/companion/FaceScanStep';
import PhoneOtpStep from '@/components/companion/PhoneOtpStep';
import CompanionDetailsForm from '@/components/companion/CompanionDetailsForm';
import LockedDetailsOverlay from '@/components/companion/LockedDetailsOverlay';
import { addSystemNotification } from '@/lib/notifications';

interface ProfileSnapshot {
  titlePrefix: 'นาย' | 'นาง' | 'นางสาว';
  rawName: string;
  vehicles: VehicleEntry[];
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  availableSchedule: string;
  skillsText: string;
  serviceAreasText: string;
}

export default function CompanionProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Snapshot for unsaved changes detection
  const [initialSnapshot, setInitialSnapshot] = useState<ProfileSnapshot | null>(null);
  const isSavingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  // Identity / Step 1 states
  const [titlePrefix, setTitlePrefix] = useState<'นาย' | 'นาง' | 'นางสาว'>('นาย');
  const [rawName, setRawName] = useState('');
  const fullName = rawName.trim() ? `${titlePrefix}${rawName.trim()}` : '';
  const [initialFullName, setInitialFullName] = useState('');
  const [nameChangeCount, setNameChangeCount] = useState(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [faceScanned, setFaceScanned] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');

  // Step 2 form states - Multi-Vehicles & Details
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [skillsText, setSkillsText] = useState('');
  const [serviceAreasText, setServiceAreasText] = useState('');
  const [availableSchedule, setAvailableSchedule] = useState('');
  const [hourlyRate, setHourlyRate] = useState(250);
  const [isAvailable, setIsAvailable] = useState(true);

  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadCompanionProfile() {
      if (typeof window !== 'undefined' && window.location.search.includes('demo=1')) {
        setUserId('demo-companion-preview');
        setTitlePrefix('นาย');
        setRawName('สมชาย บริรักษ์');
        setInitialFullName('นายสมชาย บริรักษ์');
        setNameChangeCount(1);
        setPhone('0891234567');
        const demoVehicles: VehicleEntry[] = [
          {
            id: 'car-demo-1',
            type: 'car',
            model: 'Toyota Yaris ATIV สีบรอนซ์เงิน',
            plate: '3ขก 4567 กทม.',
            rate: 350,
          },
        ];
        setVehicles(demoVehicles);
        const demoBio =
          'มีประสบการณ์ดูแลและขับรถพาผู้สูงอายุไปพบแพทย์ที่โรงพยาบาลศิริราชและจุฬาลงกรณ์เป็นประจำ ใจเย็น สุภาพ ตรงต่อเวลา';
        setBio(demoBio);
        setExperienceYears(3);
        setHourlyRate(350);
        const demoSchedule = 'จันทร์ - ศุกร์ (08:30 - 17:30 น.)';
        setAvailableSchedule(demoSchedule);
        const demoSkills = 'ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์, ปฐมพยาบาลเบื้องต้น';
        setSkillsText(demoSkills);
        const demoAreas = 'พญาไท, บางกอกน้อย, ราชเทวี, จตุจักร';
        setServiceAreasText(demoAreas);
        setFaceScanned(true);
        setPhoneVerified(true);
        setVerificationStatus('verified');
        setIsProfileSaved(true);
        setInitialSnapshot({
          titlePrefix: 'นาย',
          rawName: 'สมชาย บริรักษ์',
          vehicles: demoVehicles,
          bio: demoBio,
          experienceYears: 3,
          hourlyRate: 350,
          availableSchedule: demoSchedule,
          skillsText: demoSkills,
          serviceAreasText: demoAreas,
        });
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

      // Load full_name, phone, avatar_url from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      // Load companion profile data
      const { data } = await supabase
        .from('companion_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Determine preferred avatar: prefer user's uploaded photo over Google OAuth avatar
      const isGoogleAvatar = (url?: string | null) =>
        Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));

      let chosenAvatar: string | null = null;
      if (profileData?.avatar_url && !isGoogleAvatar(profileData.avatar_url)) {
        chosenAvatar = profileData.avatar_url;
      } else if (data?.id_card_image_url) {
        chosenAvatar = data.id_card_image_url;
      } else if (profileData?.avatar_url) {
        chosenAvatar = profileData.avatar_url;
      } else {
        chosenAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      }

      if (chosenAvatar) {
        setAvatarUrl(chosenAvatar);
      }

      let localNameOverride: string | null = null;
      if (typeof window !== 'undefined') {
        localNameOverride = localStorage.getItem('user_fullname_override');
      }

      const initialName =
        localNameOverride ||
        profileData?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        '';
      if (initialName) {
        const parsed = parseFullName(initialName);
        setTitlePrefix(parsed.prefix);
        setRawName(parsed.rawName);
        setInitialFullName(initialName);
      }

      const metadataChanges = Number(user.user_metadata?.name_change_count) || 0;
      setNameChangeCount(metadataChanges);

      if (profileData?.phone) {
        setPhone(profileData.phone);
      }

      // Ensure profile row exists in profiles table so foreign key constraint is satisfied
      if (!profileData) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          full_name: initialName || null,
          role: 'customer',
          avatar_url: chosenAvatar,
          updated_at: new Date().toISOString(),
        });
      }

      if (data) {
        const { cleanBio, embeddedSchedule } = extractCleanBio(data.bio);
        setBio(cleanBio);
        if (data.experience_years) setExperienceYears(data.experience_years);
        if (data.skills && data.skills.length > 0) setSkillsText(data.skills.join(', '));
        if (data.service_areas && data.service_areas.length > 0) setServiceAreasText(data.service_areas.join(', '));
        if (data.hourly_rate) setHourlyRate(Number(data.hourly_rate));
        if (data.available_schedule) {
          setAvailableSchedule(data.available_schedule);
        } else if (embeddedSchedule) {
          setAvailableSchedule(embeddedSchedule);
        }
        setIsAvailable(data.is_available ?? true);
        if (data.id_card_image_url) {
          setFaceImageUrl(data.id_card_image_url);
          setFaceScanned(true);
        }
        setVerificationStatus(data.verification_status || 'pending');
        if (data.phone_verified) {
          setPhoneVerified(true);
        }

        // Parse multi-vehicles list
        const parsedVehicles = parseVehiclesList(
          data.bio,
          data.vehicle_type,
          data.vehicle_model,
          data.vehicle_plate,
          data.hourly_rate
        );
        setVehicles(parsedVehicles);

        // Check if companion profile is already completed and saved as verified
        if (
          data.verification_status === 'verified' &&
          Boolean(cleanBio && cleanBio.trim().length > 0)
        ) {
          setIsProfileSaved(true);
        }

        const finalPrefix = initialName ? parseFullName(initialName).prefix : 'นาย';
        const finalRawName = initialName ? parseFullName(initialName).rawName : '';
        setInitialSnapshot({
          titlePrefix: finalPrefix,
          rawName: finalRawName,
          vehicles: parsedVehicles,
          bio: cleanBio,
          experienceYears: data.experience_years || 1,
          hourlyRate: Number(data.hourly_rate) || 250,
          availableSchedule: data.available_schedule || embeddedSchedule || '',
          skillsText: data.skills?.join(', ') || '',
          serviceAreasText: data.service_areas?.join(', ') || '',
        });
      } else {
        const fallbackPrefix = initialName ? parseFullName(initialName).prefix : 'นาย';
        const fallbackRawName = initialName ? parseFullName(initialName).rawName : '';
        setInitialSnapshot({
          titlePrefix: fallbackPrefix,
          rawName: fallbackRawName,
          vehicles: [],
          bio: '',
          experienceYears: 1,
          hourlyRate: 250,
          availableSchedule: '',
          skillsText: '',
          serviceAreasText: '',
        });
      }

      setLoading(false);
    }

    loadCompanionProfile();
  }, [supabase]);

  // Unsaved changes detection
  const normalizeVehicles = (list: VehicleEntry[]) =>
    (list || []).map((v) => ({
      type: v.type,
      model: (v.model || '').trim(),
      plate: (v.plate || '').trim(),
      rate: Number(v.rate) || 0,
    }));

  const hasUnsavedChanges = useMemo(() => {
    if (loading || !initialSnapshot) return false;

    if ((titlePrefix || 'นาย') !== (initialSnapshot.titlePrefix || 'นาย')) return true;
    if ((rawName || '').trim() !== (initialSnapshot.rawName || '').trim()) return true;
    if ((bio || '').trim() !== (initialSnapshot.bio || '').trim()) return true;
    if (Number(experienceYears || 0) !== Number(initialSnapshot.experienceYears || 0)) return true;
    if (Number(hourlyRate || 0) !== Number(initialSnapshot.hourlyRate || 0)) return true;
    if ((availableSchedule || '').trim() !== (initialSnapshot.availableSchedule || '').trim()) return true;
    if ((skillsText || '').trim() !== (initialSnapshot.skillsText || '').trim()) return true;
    if ((serviceAreasText || '').trim() !== (initialSnapshot.serviceAreasText || '').trim()) return true;

    const currentV = JSON.stringify(normalizeVehicles(vehicles));
    const initialV = JSON.stringify(normalizeVehicles(initialSnapshot.vehicles));
    if (currentV !== initialV) return true;

    return false;
  }, [
    loading,
    initialSnapshot,
    titlePrefix,
    rawName,
    bio,
    experienceYears,
    hourlyRate,
    availableSchedule,
    skillsText,
    serviceAreasText,
    vehicles,
  ]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // 1. Browser tab close / refresh / window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && !isSavingRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 2. In-app navigation interception (links, navbar, footer, logo)
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      if (!hasUnsavedChangesRef.current || isSavingRef.current) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        anchor.target === '_blank'
      ) {
        return;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(anchor.href, window.location.href);
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }
      } catch {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const result = await Swal.fire({
        title: 'ยังไม่ได้บันทึกข้อมูล!',
        text: 'คุณมีการแก้ไขข้อมูลโปรไฟล์ที่ยังไม่ได้บันทึก หากออกจากหน้านี้ ข้อมูลที่แก้ไขจะสูญหาย',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#059669',
        confirmButtonText: 'ออกจากหน้านี้ (ไม่บันทึก)',
        cancelButtonText: 'อยู่หน้านี้ต่อ (บันทึกข้อมูล)',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
          cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
        },
      });

      if (result.isConfirmed) {
        isSavingRef.current = true;
        router.push(href);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [router]);

  // 3. Browser history back/forward button (popstate)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    window.history.pushState({ unsavedGuard: true }, '', window.location.href);

    const handlePopState = async () => {
      if (!hasUnsavedChangesRef.current || isSavingRef.current) return;

      window.history.pushState({ unsavedGuard: true }, '', window.location.href);

      const result = await Swal.fire({
        title: 'ยังไม่ได้บันทึกข้อมูล!',
        text: 'คุณมีการแก้ไขข้อมูลโปรไฟล์ที่ยังไม่ได้บันทึก หากออกจากหน้านี้ ข้อมูลที่แก้ไขจะสูญหาย',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#059669',
        confirmButtonText: 'ออกจากหน้านี้ (ไม่บันทึก)',
        cancelButtonText: 'อยู่หน้านี้ต่อ (บันทึกข้อมูล)',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
          cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
        },
      });

      if (result.isConfirmed) {
        isSavingRef.current = true;
        window.history.go(-2);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Google Login for unauthenticated users
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=companion&next=/companion/profile`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  // Step 1.1: Face scan callback
  const handleScanSuccess = (faceDataUrl: string) => {
    setFaceImageUrl(faceDataUrl);
    setFaceScanned(true);
    setAvatarUrl(faceDataUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_avatar_override', faceDataUrl);
      localStorage.setItem('profile_updated', Date.now().toString());
      window.dispatchEvent(new Event('profileUpdated'));
    }
    setSuccessMsg('อัปโหลดรูปถ่ายใบหน้าสำเร็จ! กรุณากรอกเบอร์โทรศัพท์และยืนยันรหัส OTP ในขั้นตอนถัดไป');
  };

  // Avatar change handler (from camera or gallery)
  const handleAvatarChange = async (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    setFaceImageUrl(newAvatarUrl);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_avatar_override', newAvatarUrl);
      localStorage.setItem('profile_updated', Date.now().toString());
      window.dispatchEvent(new Event('profileUpdated'));
    }

    if (userId && userId !== 'demo-companion-preview') {
      try {
        await supabase
          .from('profiles')
          .update({
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await supabase
          .from('companion_profiles')
          .update({
            id_card_image_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (e) {
        console.warn('Auto-save avatar notice:', e);
      }
    }
  };

  // Step 1.2: OTP verification success callback
  const handleVerifyOtpSuccess = async () => {
    setPhoneVerified(true);
    // Phone OTP verifies phone ownership, not admin approval (which remains pending)

    try {
      if (userId) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        const { data: curProf } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        // หากมี record ใน companion_profiles อยู่แล้ว ให้อัปเดตสถานะเบอร์โทร (แต่ถ้ายังไม่มี จะไม่สร้างร่างเปล่าเพื่อไม่ให้ไปขึ้นที่แอดมินก่อนกดส่ง)
        const { data: existingComp } = await supabase
          .from('companion_profiles')
          .select('id, verification_status')
          .eq('id', userId)
          .maybeSingle();

        const currentRole =
          curProf?.role === 'admin'
            ? 'admin'
            : existingComp?.verification_status === 'verified'
            ? 'companion'
            : 'customer';

        await supabase.from('profiles').upsert({
          id: userId,
          email: currentUser?.email || '',
          full_name: fullName.trim() || null,
          phone: phone.trim(),
          role: currentRole,
          avatar_url: avatarUrl || faceImageUrl || null,
          updated_at: new Date().toISOString(),
        });

        if (existingComp) {
          await supabase
            .from('companion_profiles')
            .update({
              phone_verified: true,
              id_card_image_url: avatarUrl || faceImageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }

      setSuccessMsg(
        '🎉 ยืนยันตัวตนสำเร็จ! สแกนใบหน้าและยืนยันเบอร์โทรศัพท์ผ่านแล้ว กรุณากรอกข้อมูลและรายละเอียดด้านล่างให้ครบถ้วน จากนั้นกดบันทึกเพื่อส่งให้แอดมินตรวจสอบ'
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

    if (!bio.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลแนะนำตัวและประสบการณ์ของคุณ');
      return;
    }

    if (!hourlyRate || Number(hourlyRate) < 50) {
      setErrorMsg('กรุณาระบุอัตราค่าบริการเริ่มต้นอย่างน้อย 50 บาท');
      return;
    }

    // Name change quota check
    const nameChanged = Boolean(
      initialFullName.trim() && fullName.trim() !== initialFullName.trim()
    );
    if (nameChanged && nameChangeCount >= 3) {
      setErrorMsg('คุณใช้สิทธิ์เปลี่ยนชื่อครบ 3 ครั้งแล้ว ไม่สามารถเปลี่ยนชื่อได้อีก');
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

    const formattedVehicles = formatVehiclesToFields(vehicles, Number(hourlyRate) || 250);

    try {
      if (userId === 'demo-companion-preview') {
        if (nameChanged) {
          setNameChangeCount((prev) => prev + 1);
          setInitialFullName(fullName.trim());
        }
        setIsProfileSaved(true);
        setSuccessMsg('🎉 บันทึกข้อมูลโปรไฟล์และเปิดรับงานเรียบร้อยแล้ว! (โหมดทดลองใช้งาน)');
        setInitialSnapshot({
          titlePrefix,
          rawName,
          vehicles,
          bio,
          experienceYears,
          hourlyRate,
          availableSchedule,
          skillsText,
          serviceAreasText,
        });
        isSavingRef.current = true;
        addSystemNotification(userId, {
          id: `comp-verif-pending-${userId}`,
          type: 'verification_pending',
          title: 'กรุณารอการอนุมัติ',
          message:
            'ระบบได้รับข้อมูลการสมัครเป็น Companion ของคุณแล้ว (โหมดทดลองใช้งาน) ขณะนี้อยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ กรุณารอการอนุมัติ',
          link: '/companion/dashboard',
        });
        await Swal.fire({
          title: 'ส่งข้อมูลเรียบร้อย!',
          text: 'ระบบได้รับข้อมูลการสมัครแล้ว กำลังนำคุณกลับไปยังแดชบอร์ดงาน...',
          icon: 'success',
          confirmButtonColor: '#059669',
          confirmButtonText: 'ไปยังแดชบอร์ดทันที',
          timer: 1800,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-3xl shadow-2xl font-sans',
            confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
          },
        });
        router.push('/companion/dashboard?submitted=1');
        return;
      }

      // Save custom full_name to localStorage cache immediately
      if (typeof window !== 'undefined' && fullName.trim()) {
        localStorage.setItem('user_fullname_override', fullName.trim());
      }

      // If name changed, increment quota count and update auth user metadata
      const userMetadataUpdates: Record<string, unknown> = {
        full_name: fullName.trim(),
        name: fullName.trim(),
      };
      if (nameChanged) {
        const nextCount = nameChangeCount + 1;
        userMetadataUpdates.name_change_count = nextCount;
        setNameChangeCount(nextCount);
        setInitialFullName(fullName.trim());
      }
      await supabase.auth.updateUser({
        data: userMetadataUpdates,
      });

      // 1. Ensure user has an existing row in profiles table (UPSERT)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const profilePayload = {
        id: userId,
        email: authUser?.email || '',
        full_name:
          fullName.trim() ||
          authUser?.user_metadata?.full_name ||
          authUser?.user_metadata?.name ||
          null,
        phone: phone.trim() || null,
        role: 'companion' as const,
        avatar_url:
          avatarUrl ||
          faceImageUrl ||
          authUser?.user_metadata?.avatar_url ||
          authUser?.user_metadata?.picture ||
          null,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (profileError) {
        console.warn('Profile upsert notice:', profileError.message);
      }

      // 2. Check if companion_profiles row exists
      const { data: existingComp } = await supabase
        .from('companion_profiles')
        .select('id, verification_status')
        .eq('id', userId)
        .maybeSingle();

      const isAlreadyVerified = existingComp?.verification_status === 'verified';
      const nextVerificationStatus = isAlreadyVerified ? 'verified' : 'pending';
      const isAvailableFinal = isAlreadyVerified ? isAvailable : false;

      // 3. Fallback bio with embedded metadata (vehicles list & schedule)
      const enrichedBio = embedBioMetadata(bio, {
        schedule: availableSchedule,
        vehiclesList: vehicles,
      });

      // 4. Prepare payload for dedicated columns (if migration has run)
      const fullUpdateData: Record<string, unknown> = {
        bio: enrichedBio,
        experience_years: Math.max(0, Number(experienceYears) || 0),
        skills: skillsArray,
        service_areas: areasArray,
        available_schedule: availableSchedule,
        hourly_rate: Math.max(50, Number(hourlyRate) || formattedVehicles.hourly_rate),
        is_available: isAvailableFinal,
        verification_status: nextVerificationStatus,
        phone_verified: true,
        vehicle_type: formattedVehicles.vehicle_type,
        vehicle_model: formattedVehicles.vehicle_model,
        vehicle_plate: formattedVehicles.vehicle_plate,
        id_card_image_url: avatarUrl || faceImageUrl,
        updated_at: new Date().toISOString(),
      };

      // 5. Safe payload (if vehicle columns don't exist in Supabase schema cache)
      const safeUpdateData: Record<string, unknown> = {
        bio: enrichedBio,
        experience_years: Math.max(0, Number(experienceYears) || 0),
        skills: skillsArray,
        service_areas: areasArray,
        hourly_rate: Math.max(50, Number(hourlyRate) || formattedVehicles.hourly_rate),
        is_available: isAvailableFinal,
        verification_status: nextVerificationStatus,
        phone_verified: true,
        id_card_image_url: avatarUrl || faceImageUrl,
        updated_at: new Date().toISOString(),
      };

      let saveError: { message?: string; details?: string; hint?: string; code?: string } | null = null;

      if (existingComp) {
        // Record exists -> UPDATE
        const { error: updErr } = await supabase
          .from('companion_profiles')
          .update(fullUpdateData)
          .eq('id', userId);

        if (updErr) {
          const isMissingCol =
            updErr.code === 'PGRST204' ||
            updErr.message?.includes('column') ||
            updErr.message?.includes('schema cache');

          if (isMissingCol) {
            const { error: safeUpdErr } = await supabase
              .from('companion_profiles')
              .update(safeUpdateData)
              .eq('id', userId);

            if (safeUpdErr) saveError = safeUpdErr;
          } else {
            saveError = updErr;
          }
        }
      } else {
        // Record does not exist -> INSERT
        const fullInsertData = {
          id: userId,
          ...fullUpdateData,
        };

        const { error: insErr } = await supabase
          .from('companion_profiles')
          .insert(fullInsertData);

        if (insErr) {
          const isMissingCol =
            insErr.code === 'PGRST204' ||
            insErr.message?.includes('column') ||
            insErr.message?.includes('schema cache');

          if (isMissingCol) {
            const safeInsertData = {
              id: userId,
              ...safeUpdateData,
            };

            const { error: safeInsErr } = await supabase
              .from('companion_profiles')
              .insert(safeInsertData);

            if (safeInsErr) {
              const { error: secondaryUpdErr } = await supabase
                .from('companion_profiles')
                .update(safeUpdateData)
                .eq('id', userId);

              if (secondaryUpdErr) saveError = safeInsErr;
            }
          } else {
            saveError = insErr;
          }
        }
      }

      if (saveError) {
        throw saveError;
      }

      setIsProfileSaved(true);
      setSuccessMsg(
        isAlreadyVerified
          ? '🎉 บันทึกการแก้ไขข้อมูลโปรไฟล์เรียบร้อยแล้ว!'
          : '🎉 ส่งข้อมูลโปรไฟล์เรียบร้อยแล้ว! แอดมินจะดำเนินการตรวจสอบข้อมูลและอนุมัติเปิดรับงานให้คุณ'
      );
      setInitialSnapshot({
        titlePrefix,
        rawName,
        vehicles,
        bio,
        experienceYears,
        hourlyRate,
        availableSchedule,
        skillsText,
        serviceAreasText,
      });
      isSavingRef.current = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profileUpdated'));
      }
      if (!isAlreadyVerified) {
        addSystemNotification(userId, {
          id: `comp-verif-pending-${userId}`,
          type: 'verification_pending',
          title: 'กรุณารอการอนุมัติ',
          message:
            'ระบบได้รับข้อมูลการสมัครเป็น Companion ของคุณแล้ว ขณะนี้อยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ กรุณารอการอนุมัติ',
          link: '/companion/dashboard',
        });
      }

      await Swal.fire({
        title: isAlreadyVerified ? 'บันทึกสำเร็จ!' : 'ส่งข้อมูลเรียบร้อย!',
        text: isAlreadyVerified
          ? 'บันทึกการแก้ไขข้อมูลโปรไฟล์และยานพาหนะเรียบร้อยแล้ว'
          : 'ส่งข้อมูลโปรไฟล์และหลักฐานให้แอดมินตรวจสอบเรียบร้อยแล้ว ระบบกำลังนำคุณกลับไปยังแดชบอร์ดงาน...',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ไปยังแดชบอร์ดงาน',
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });

      router.push(isAlreadyVerified ? '/companion/dashboard' : '/companion/dashboard?submitted=1');
    } catch (err: unknown) {
      isSavingRef.current = false;
      const postgrestErr = err as { message?: string; details?: string; hint?: string; code?: string };
      const displayMsg =
        postgrestErr?.message ||
        postgrestErr?.details ||
        (err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');

      console.warn('handleSaveProfile notice:', displayMsg, postgrestErr);
      setErrorMsg(displayMsg);

      await Swal.fire({
        title: 'ไม่สามารถบันทึกข้อมูลได้',
        text: displayMsg,
        icon: 'error',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete / Deactivate Companion Profile
  const handleDeleteProfile = async () => {
    if (!userId) return;

    const result = await Swal.fire({
      title: 'ยืนยันการลบโปรไฟล์ผู้ช่วย?',
      text: 'โปรไฟล์ของคุณจะไม่แสดงบนระบบค้นหา และจะไม่สามารถรับงานเป็น Companion ได้อีกต่อไปจนกว่าจะลงทะเบียนใหม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบโปรไฟล์',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-6 py-2.5 font-bold',
      },
    });

    if (!result.isConfirmed) return;

    isSavingRef.current = true;
    setSaving(true);
    try {
      if (userId === 'demo-companion-preview') {
        await Swal.fire({
          title: 'ลบโปรไฟล์เรียบร้อย',
          text: 'ระบบได้ปิดการใช้งานโปรไฟล์ผู้ช่วยของคุณแล้ว (โหมดทดลองใช้งาน)',
          icon: 'success',
          confirmButtonColor: '#059669',
          confirmButtonText: 'ตกลง',
          timer: 1800,
          timerProgressBar: true,
        });
        router.push('/');
        return;
      }

      // 1. Delete companion profile completely from companion_profiles table
      const { error: delErr } = await supabase
        .from('companion_profiles')
        .delete()
        .eq('id', userId);

      // If delete had any error (e.g. policy constraint), wipe all fields completely
      if (delErr) {
        console.warn('Companion delete notice, clearing fields:', delErr.message);
        await supabase
          .from('companion_profiles')
          .update({
            bio: null,
            experience_years: 0,
            skills: [],
            service_areas: [],
            available_schedule: null,
            hourly_rate: 0,
            is_available: false,
            verification_status: 'pending',
            phone_verified: false,
            id_card_image_url: null,
            vehicle_type: 'none',
            vehicle_model: null,
            vehicle_plate: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // 2. Change role in profiles table to customer
      await supabase
        .from('profiles')
        .update({
          role: 'customer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // 3. Reset name change quota in auth metadata
      try {
        await supabase.auth.updateUser({
          data: {
            name_change_count: 0,
          },
        });
      } catch (authErr) {
        console.warn('Reset quota notice:', authErr);
      }

      // 4. Clear all local storage overrides
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_fullname_override');
        localStorage.removeItem('user_avatar_override');
        localStorage.removeItem('profile_updated');
        localStorage.removeItem('pending_booking_requirements');
        window.dispatchEvent(new Event('profileUpdated'));
      }

      // 5. Reset local component state
      setBio('');
      setSkillsText('');
      setServiceAreasText('');
      setVehicles([]);
      setAvailableSchedule('');
      setHourlyRate(250);
      setAvatarUrl(null);
      setFaceImageUrl(null);
      setFaceScanned(false);
      setPhoneVerified(false);
      setVerificationStatus('pending');
      setIsProfileSaved(false);
      setIsAvailable(false);
      setNameChangeCount(0);
      setInitialSnapshot(null);

      await Swal.fire({
        title: 'ลบโปรไฟล์ผู้ช่วยสำเร็จ',
        text: 'ระบบได้ลบข้อมูลโปรไฟล์ผู้ช่วยของคุณทั้งหมดแล้ว หากต้องการเป็นผู้ช่วยอีกครั้งสามารถลงทะเบียนใหม่ได้ตลอดเวลา',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        timer: 2200,
        timerProgressBar: true,
      });

      router.push('/');
    } catch (err) {
      isSavingRef.current = false;
      console.error('Failed to delete profile:', err);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบโปรไฟล์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonColor: '#059669',
      });
    } finally {
      setSaving(false);
    }
  };

  // Allow companion to reset status to pending for testing or re-verification
  const handleResetToPending = async () => {
    if (!userId) return;
    const confirm = await Swal.fire({
      title: 'ต้องการส่งข้อมูลให้แอดมินตรวจสอบใหม่?',
      text: 'ระบบจะเปลี่ยนสถานะบัญชีของคุณเป็น "รอการอนุมัติ" เพื่อให้คุณสามารถทดสอบขั้นตอนรออนุมัติและการอนุมัติจากแอดมินได้',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยืนยัน ปรับเป็นรออนุมัติ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      if (userId !== 'demo-companion-preview') {
        await supabase
          .from('companion_profiles')
          .update({
            verification_status: 'pending',
            is_available: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      setVerificationStatus('pending');
      setIsProfileSaved(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`carecompanion_known_status_${userId}`, 'pending');
        localStorage.removeItem(`carecompanion_shown_approval_${userId}`);
      }

      addSystemNotification(userId, {
        id: `comp-verif-pending-${userId}`,
        type: 'verification_pending',
        title: 'กรุณารอการอนุมัติ',
        message:
          'ระบบได้รับข้อมูลการสมัครเป็น Companion ของคุณแล้ว ขณะนี้อยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ กรุณารอการอนุมัติ',
        link: '/companion/dashboard',
      });

      router.push('/companion/dashboard?submitted=1');
    } catch (e) {
      console.error(e);
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
                setInitialFullName('นายสมชาย บริรักษ์');
                setNameChangeCount(1);
                setPhone('0891234567');
                setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces');
                setVehicles([
                  {
                    id: 'car-demo-1',
                    type: 'car',
                    model: 'Toyota Yaris ATIV สีบรอนซ์เงิน',
                    plate: '3ขก 4567 กทม.',
                    rate: 350,
                  },
                ]);
                setBio('มีประสบการณ์ดูแลและขับรถพาผู้สูงอายุไปพบแพทย์ที่โรงพยาบาลศิริราชและจุฬาลงกรณ์เป็นประจำ ใจเย็น สุภาพ ตรงต่อเวลา');
                setExperienceYears(3);
                setHourlyRate(350);
                setAvailableSchedule('จันทร์ - ศุกร์ (08:30 - 17:30 น.)');
                setSkillsText('ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์, ปฐมพยาบาลเบื้องต้น');
                setServiceAreasText('พญาไท, บางกอกน้อย, ราชเทวี, จตุจักร');
                setFaceScanned(true);
                setPhoneVerified(true);
                setVerificationStatus('verified');
                setIsProfileSaved(true);
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
              <span>{isProfileSaved ? 'จัดการโปรไฟล์ผู้ช่วย' : 'สมัครเป็นผู้ช่วย'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight break-words">
              {isProfileSaved ? 'จัดการข้อมูลโปรไฟล์ผู้ช่วย (Companion)' : 'สมัครเป็นผู้ช่วย (Companion)'}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              {isProfileSaved
                ? 'แก้ไขข้อมูลส่วนตัว ยานพาหนะ และรายละเอียดการให้บริการของคุณ'
                : 'กรอกข้อมูลส่วนตัว ยานพาหนะ และรายละเอียดการให้บริการเพื่อเริ่มรับงาน'}
            </p>
          </div>

          {isProfileSaved && (
            <Link
              href="/companion/dashboard"
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-bold hover:bg-gray-50 shadow-xs transition shrink-0 inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-teal-600" />
              กลับสู่แดชบอร์ดงาน ➔
            </Link>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            {isProfileSaved && (
              <Link
                href="/companion/dashboard"
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition shrink-0 shadow-xs inline-flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                ไปยังแดชบอร์ดงานของฉัน ➔
              </Link>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: IDENTITY VERIFICATION (Only shown when not yet verified) */}
        {!isVerified && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-teal-100 shadow-lg shadow-teal-50 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 bg-teal-100 text-teal-800">
                  <ScanFace className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 break-words">
                      ขั้นตอนที่ 1: ยืนยันตัวตน (สแกนใบหน้าจริง + เบอร์โทรศัพท์ OTP)
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 bg-amber-100 text-amber-800">
                      จำเป็นต้องทำก่อน
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    เพื่อความปลอดภัยและความอุ่นใจของผู้สูงอายุ ผู้ช่วยต้องสแกนใบหน้าจริงและยืนยันเบอร์มือถือ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <FaceScanStep
                faceScanned={faceScanned}
                faceImageUrl={faceImageUrl}
                onScanSuccess={handleScanSuccess}
                onResetFace={() => setFaceScanned(false)}
              />

              <PhoneOtpStep
                faceScanned={faceScanned}
                phoneVerified={phoneVerified}
                titlePrefix={titlePrefix}
                setTitlePrefix={setTitlePrefix}
                rawName={rawName}
                setRawName={setRawName}
                phone={phone}
                setPhone={setPhone}
                onVerifySuccess={handleVerifyOtpSuccess}
              />
            </div>
          </div>
        )}

        {/* If Companion is already verified, show active banner with option to reset to pending for testing */}
        {verificationStatus === 'verified' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-950">
                  บัญชีของคุณได้รับการอนุมัติแล้ว (พร้อมรับงาน)
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-700">
                  คุณสามารถแก้ไขข้อมูลโปรไฟล์ด้านล่างได้ตลอดเวลา หรือปรับสถานะเป็นรออนุมัติหากต้องการทดสอบการสมัครใหม่
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToPending}
              disabled={saving}
              className="shrink-0 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              🔄 ปรับเป็นรออนุมัติ (เพื่อทดสอบส่งตรวจใหม่)
            </button>
          </div>
        )}

        {/* COMPANION DETAILS FORM */}
        <div className="relative">
          {!isVerified && (
            <LockedDetailsOverlay faceScanned={faceScanned} />
          )}

          <CompanionDetailsForm
            isVerified={isVerified}
            isProfileSaved={isProfileSaved}
            saving={saving}
            hasUnsavedChanges={hasUnsavedChanges}
            avatarUrl={avatarUrl}
            setAvatarUrl={handleAvatarChange}
            titlePrefix={titlePrefix}
            setTitlePrefix={setTitlePrefix}
            rawName={rawName}
            setRawName={setRawName}
            nameChangeCount={nameChangeCount}
            phone={phone}
            vehicles={vehicles}
            setVehicles={setVehicles}
            bio={bio}
            setBio={setBio}
            experienceYears={experienceYears}
            setExperienceYears={setExperienceYears}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            availableSchedule={availableSchedule}
            setAvailableSchedule={setAvailableSchedule}
            skillsText={skillsText}
            setSkillsText={setSkillsText}
            serviceAreasText={serviceAreasText}
            setServiceAreasText={setServiceAreasText}
            onSubmit={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
