import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatThaiDate } from '@/lib/utils';
import { CompanionCardData } from '@/types/database';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  Phone,
  ArrowLeft,
  HeartHandshake,
  User,
  Car,
  Bike,
  Footprints,
  Lock,
  CheckCircle2,
  LogIn,
  AlertTriangle,
  Clock,
  Mail,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { parseVehicleDetails, extractCleanBio } from '@/lib/vehicleUtils';
import ReportCompanionButton from '@/components/customer/ReportCompanionButton';
import {
  MOCK_COMPANIONS,
} from '@/components/companions/search/constants';

function maskPhoneNumber(phone?: string | null) {
  if (!phone) return '08x-***-****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(7)}`;
  }
  return '08x-***-****';
}

function maskPlate(plate?: string | null) {
  if (!plate) return '*** ****';
  const parts = plate.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} **** ${parts.slice(2).join(' ')}`.trim();
  }
  return '*** ****';
}

export default async function CompanionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isDemoAdmin = resolvedSearchParams.demo_admin === '1' || resolvedSearchParams.admin === '1';
  const supabase = await createClient();

  // Check customer login state for privacy-gated data (phone, full license plate, reviews)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Check if current user is an admin
  let isAdmin = isDemoAdmin;
  if (currentUser) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle();
    isAdmin = isAdmin || prof?.role === 'admin' || currentUser.user_metadata?.role === 'admin';
  }

  // Check if current user has an active/completed booking with this companion
  let hasBookedCompanion = false;
  if (currentUser) {
    const { data: userBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', currentUser.id)
      .eq('companion_id', id)
      .limit(1)
      .maybeSingle();
    hasBookedCompanion = Boolean(userBooking);
  }

  // Try to load companion from Supabase
  let companion: CompanionCardData | null = null;
  const { data } = await supabase
    .from('companion_profiles')
    .select(`
      *,
      profile:profiles(full_name, avatar_url, phone, email)
    `)
    .eq('id', id)
    .single();

  if (data) {
    const isOwner = currentUser?.id === data.id;

    // Enrich hourly rate from vehicle or bio if 0
    let effectiveRate = Number(data.hourly_rate) || 0;
    if (effectiveRate <= 0 && data.vehicle_model) {
      const match = data.vehicle_model.match(/\[฿(\d+)\]/);
      if (match && match[1]) effectiveRate = parseInt(match[1], 10);
    }
    if (effectiveRate <= 0 && data.bio) {
      const match = data.bio.match(/\[฿(\d+)\]/);
      if (match && match[1]) effectiveRate = parseInt(match[1], 10);
    }
    if (effectiveRate > 0) {
      data.hourly_rate = effectiveRate;
    }

    const hasName = Boolean(data.profile?.full_name && data.profile.full_name.trim().length > 0);
    const hasBio = Boolean(data.bio && data.bio.trim().length > 0);
    const isComplete = hasName && (hasBio || data.experience_years > 0);

    // If profile has no basic info and user is not owner, 404
    if (!isComplete && !isOwner) {
      notFound();
    }
    companion = data as unknown as CompanionCardData;
  } else {
    const mock = MOCK_COMPANIONS.find((c) => c.id === id);
    if (mock) {
      companion = mock;
    } else {
      notFound();
    }
  }

  // Fetch real reviews for this companion from Supabase (disambiguating customer_id relationship)
  const { data: dbReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      customer:profiles!customer_id(full_name, avatar_url)
    `)
    .eq('companion_id', id)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.warn('Error fetching real reviews:', reviewsError);
  }

  // Only real reviews from real users who actually booked and reviewed
  const reviews = dbReviews || [];

  const realReviewCount = reviews.length;
  const realRatingAvg =
    realReviewCount > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / realReviewCount
      : 0;

  const { cleanBio, embeddedSchedule } = extractCleanBio(companion.bio);
  const activeSchedule = companion.available_schedule || embeddedSchedule;

  const parsedVehicles = parseVehicleDetails(
    companion.vehicle_type,
    companion.vehicle_model,
    companion.vehicle_plate,
    companion.hourly_rate,
    companion.bio
  );
  const vehicleType = parsedVehicles.type;
  const hasVehicle = parsedVehicles.hasCar || parsedVehicles.hasMotorcycle;
  const isGoogleAvatar = (url?: string | null) =>
    Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));

  const companionAvatar =
    companion.profile?.avatar_url && !isGoogleAvatar(companion.profile.avatar_url)
      ? companion.profile.avatar_url
      : companion.id_card_image_url || companion.profile?.avatar_url || '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0">
        {/* Back Link */}
        <Link
          href="/companions"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-emerald-700 mb-4 sm:mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับไปหน้ารายชื่อ Companion
        </Link>

        {/* Guest Privacy Notification Banner if not logged in */}
        {!currentUser && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-1.5">
                  โหมดผู้เยี่ยมชม (Guest View)
                </h4>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  หมายเลขทะเบียนรถถูกปิดบังไว้บางส่วนเพื่อความปลอดภัย (หมายเลขโทรศัพท์จะแสดงเมื่อคุณจองผู้ช่วยแล้วเท่านั้น)
                </p>
              </div>
            </div>
            <Link
              href={`/login?redirect=/companions/${id}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition active:scale-95 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ Care Companion
            </Link>
          </div>
        )}

        {/* Suspension Notice Banner */}
        {companion.is_suspended && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start sm:items-center gap-3.5 shadow-xs mb-6">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-sm sm:text-base font-extrabold text-rose-950">
                ผู้ช่วยท่านนี้อยู่ระหว่างการพักการให้บริการชั่วคราว
              </strong>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">
                {companion.suspension_reason || 'ระบบพักการรับงานชั่วคราวเพื่อตรวจสอบข้อร้องเรียนและการบริการ'}
              </p>
            </div>
          </div>
        )}

        <div className={isAdmin ? 'max-w-4xl mx-auto space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'}>
          {/* Main Profile Info (Col 1 & 2 for regular users, full width for admin) */}
          <div className={isAdmin ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-200/80 shadow-xs space-y-5 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-300 shrink-0 shadow-sm">
                  {companionAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={companionAvatar}
                      alt={companion.profile?.full_name || 'Companion'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-950 break-words">
                      {companion.profile?.full_name}
                    </h1>
                    {companion.verification_status === 'verified' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        ยืนยันใบหน้า & เบอร์โทรแล้ว
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    ผู้ให้บริการร่วมเดินทาง (Companion)
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600 pt-1">
                    {realReviewCount > 0 ? (
                      <>
                        <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          <Star className="w-4 h-4 fill-amber-400" />
                          {realRatingAvg.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{realReviewCount} รีวิวจากผู้ใช้จริง</span>
                        <span>•</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ผู้ช่วยใหม่ (ยังไม่มีรีวิว)
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      ประสบการณ์ {companion.experience_years} ปี
                    </span>
                  </div>

                  {/* Admin Specific Contact & Rate Info */}
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-gray-100 mt-2 text-xs">
                      <a
                        href={`tel:${companion.profile?.phone || ''}`}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        เบอร์ติดต่อ: {companion.profile?.phone || 'ไม่ระบุ'}
                      </a>
                      {companion.profile?.email && (
                        <a
                          href={`mailto:${companion.profile.email}`}
                          className="inline-flex items-center gap-1.5 font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 transition"
                        >
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          {companion.profile.email}
                        </a>
                      )}
                      <span className="inline-flex items-center gap-1.5 font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                        เรทค่าบริการ:{' '}
                        {vehicleType === 'both'
                          ? `฿${parsedVehicles.motorcycle.rate} - ฿${parsedVehicles.car.rate}`
                          : formatPrice(companion.hourly_rate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="border-t border-gray-100 pt-5 space-y-2">
                <h2 className="text-base font-bold text-gray-900">เกี่ยวกับผู้ช่วย</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {cleanBio || 'ยังไม่มีคำแนะนำตัว'}
                </p>
              </div>

              {/* Available Schedule */}
              {activeSchedule && (
                <div className="border-t border-gray-100 pt-5 space-y-2">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-700" />
                    วันและเวลาที่สะดวกให้บริการ
                  </h2>
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeSchedule}</span>
                  </div>
                </div>
              )}

              {/* Vehicle & Transportation Details (Grab-style Transport Card) */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {vehicleType === 'both' ? (
                      <Car className="w-5 h-5 text-emerald-700" />
                    ) : vehicleType === 'car' ? (
                      <Car className="w-5 h-5 text-emerald-700" />
                    ) : vehicleType === 'motorcycle' ? (
                      <Bike className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Footprints className="w-5 h-5 text-gray-600" />
                    )}
                    ยานพาหนะและการเดินทาง
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      vehicleType === 'both'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vehicleType === 'car'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vehicleType === 'motorcycle'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {vehicleType === 'both'
                      ? '🚗+🛵 มีทั้งรถยนต์และมอเตอร์ไซค์'
                      : vehicleType === 'car'
                      ? '🚗 รถยนต์ส่วนตัว'
                      : vehicleType === 'motorcycle'
                      ? '🛵 รถมอเตอร์ไซค์'
                      : '🚶 ขนส่งสาธารณะ'}
                  </span>
                </div>

                <div
                  className={`rounded-2xl p-4 border ${
                    hasVehicle
                      ? 'bg-emerald-50/50 border-emerald-150'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {vehicleType === 'both' ? (
                    <div className="space-y-4">
                      {/* Car block */}
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-emerald-700" />
                            <span>1. รถยนต์ส่วนตัว (Car / SUV)</span>
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ฿{parsedVehicles.car.rate}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">ยี่ห้อ / รุ่น / สี: </span>
                            <span className="font-bold text-gray-900">
                              {parsedVehicles.car.model || 'ไม่ระบุรุ่น'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">ทะเบียน: </span>
                            {currentUser ? (
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {parsedVehicles.car.plate || 'ระบุแล้ว'}
                              </span>
                            ) : (
                              <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {maskPlate(parsedVehicles.car.plate)} (เข้าสู่ระบบเพื่อดู)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Motorcycle block */}
                      <div className="p-3.5 rounded-xl bg-white border border-teal-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                            <Bike className="w-4 h-4 text-teal-700" />
                            <span>2. รถจักรยานยนต์ (Motorcycle)</span>
                          </span>
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                            ฿{parsedVehicles.motorcycle.rate}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">ยี่ห้อ / รุ่น / สี: </span>
                            <span className="font-bold text-gray-900">
                              {parsedVehicles.motorcycle.model || 'ไม่ระบุรุ่น'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">ทะเบียน: </span>
                            {currentUser ? (
                              <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {parsedVehicles.motorcycle.plate || 'ระบุแล้ว'}
                              </span>
                            ) : (
                              <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {maskPlate(parsedVehicles.motorcycle.plate)} (เข้าสู่ระบบเพื่อดู)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 pt-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          ลูกค้าสามารถเลือกระหว่าง <strong>&ldquo;รถยนต์&rdquo;</strong> หรือ <strong>&ldquo;มอเตอร์ไซค์&rdquo;</strong> ในขั้นตอนการจองได้ โดยคิดค่าบริการตามคันที่เลือกจริง
                        </span>
                      </div>
                    </div>
                  ) : hasVehicle ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">ยี่ห้อ / รุ่น / สี</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {vehicleType === 'car'
                              ? parsedVehicles.car.model || 'ไม่ระบุรุ่น'
                              : parsedVehicles.motorcycle.model || 'ไม่ระบุรุ่น'}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500 font-medium">หมายเลขทะเบียนรถ</p>
                          {currentUser ? (
                            <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                              <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                                {vehicleType === 'car'
                                  ? parsedVehicles.car.plate || 'ระบุแล้วในระบบ'
                                  : parsedVehicles.motorcycle.plate || 'ระบุแล้วในระบบ'}
                              </span>
                              <span className="text-[11px] text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ยืนยันแล้ว
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 sm:justify-end mt-0.5">
                              <span className="font-mono text-sm text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-300">
                                {maskPlate(
                                  vehicleType === 'car'
                                    ? parsedVehicles.car.plate
                                    : parsedVehicles.motorcycle.plate
                                )}
                              </span>
                              <Link
                                href={`/login?redirect=/companions/${id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition"
                              >
                                <Lock className="w-3 h-3" />
                                เข้าสู่ระบบเพื่อดู
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 pt-2 border-t border-emerald-100/80 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {vehicleType === 'car'
                            ? 'สามารถเดินทางไปรับ-ส่งถึงที่พัก และอำนวยความสะดวกตลอดทาง'
                            : 'คล่องตัวสูง เหมาะสำหรับธุระด่วน เดินทางสะดวกรวดเร็วในชั่วโมงเร่งด่วน'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-xs text-gray-600">
                      <Footprints className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">เน้นขนส่งสาธารณะหรือพบกัน ณ จุดนัดหมาย</p>
                        <p className="mt-0.5">
                          ผู้ช่วยจะเดินทางไปพบคุณ ณ โรงพยาบาล สถานที่ราชการ หรือจุดนัดพบที่ตกลงกัน เช่น สถานี BTS / MRT
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="border-t border-gray-100 pt-5 space-y-2">
                <h2 className="text-base font-bold text-gray-900">ทักษะและความเชี่ยวชาญ</h2>
                <div className="flex flex-wrap gap-2">
                  {companion.skills?.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-medium text-xs border border-emerald-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div className="border-t border-gray-100 pt-5 space-y-2">
                <h2 className="text-base font-bold text-gray-900">พื้นที่ให้บริการที่สะดวก</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{companion.service_areas?.join(', ') || 'ไม่ระบุ'}</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-bold text-gray-950 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    รีวิวและความคิดเห็นจากผู้ใช้งานจริง ({realReviewCount})
                  </h2>
                  <p className="text-xs text-gray-500">
                    {realReviewCount > 0
                      ? `คะแนนเฉลี่ย ${realRatingAvg.toFixed(1)} / 5.0 จากผู้รับบริการจริง`
                      : 'ยังไม่มีคะแนนรีวิวสำหรับผู้ช่วยท่านนี้ (รอรับงานจริงจากลูกค้า)'}
                  </p>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                /* Show real reviews and real customers who reviewed */
                <div className="space-y-4 divide-y divide-gray-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden shrink-0 border border-emerald-200 shadow-xs">
                            {rev.customer?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={rev.customer.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-emerald-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-gray-900 truncate">
                                {rev.customer?.full_name || 'ลูกค้า Care Companion'}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                ผู้ใช้บริการจริง
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {rev.created_at ? formatThaiDate(rev.created_at) : 'เมื่อเร็วๆ นี้'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 shrink-0 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          {[...Array(Math.min(5, Math.max(1, rev.rating || 5)))].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ))}
                          <span className="text-xs font-bold text-amber-800 ml-1">
                            {Number(rev.rating || 5).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50/80 border border-dashed border-gray-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-2xs">
                    <Star className="w-6 h-6 fill-amber-300 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    ยังไม่มีรีวิวสำหรับผู้ช่วยท่านนี้
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    เมื่อมีลูกค้าที่รับบริการจริงเสร็จสิ้นการเดินทางและส่งคะแนนประเมิน รีวิวและความคิดเห็นจริงจะปรากฏที่นี่
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Booking Action Card (Col 3) - Only for regular customers, hidden for Admin */}
          {!isAdmin && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-xl shadow-emerald-100/50 sticky top-28 space-y-6">
                <div className="flex items-baseline justify-between pb-4 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-500">อัตราค่าบริการ</span>
                  {vehicleType === 'both' ? (
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-700">
                        ฿{parsedVehicles.motorcycle.rate} - ฿{parsedVehicles.car.rate}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium block">(ตามพาหนะที่เลือก)</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-black text-emerald-700">
                        {formatPrice(companion.hourly_rate)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>ยืนยันใบหน้าจริง & เบอร์โทรศัพท์ (OTP) แล้ว</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    {vehicleType === 'both' ? (
                      <>
                        <Car className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>มีทั้งรถยนต์และมอเตอร์ไซค์ (เลือกได้ตอนจอง)</span>
                      </>
                    ) : vehicleType === 'car' ? (
                      <>
                        <Car className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>มีรถยนต์ส่วนตัว (บริการรับ-ส่งถึงที่)</span>
                      </>
                    ) : vehicleType === 'motorcycle' ? (
                      <>
                        <Bike className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>มีมอเตอร์ไซค์ส่วนตัว (คล่องตัว/รวดเร็ว)</span>
                      </>
                    ) : (
                      <>
                        <Footprints className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>ขนส่งสาธารณะ / นัดพบตามสถานที่</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>ดูแลและช่วยเหลืออำนวยความสะดวกตลอดทาง</span>
                  </div>

                  {activeSchedule && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>เวลาให้บริการ: {activeSchedule}</span>
                    </div>
                  )}

                  {/* Contact Phone: แสดงเฉพาะเมื่อผู้ใช้ได้ทำการจองผู้ช่วยท่านนี้แล้ว (หรือเป็น Admin/เจ้าของโปรไฟล์) */}
                  {(hasBookedCompanion || isAdmin || (currentUser && currentUser.id === companion.id)) && companion.profile?.phone && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-800 font-medium text-xs">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        เบอร์ติดต่อผู้ช่วย:
                      </span>
                      <a
                        href={`tel:${companion.profile.phone}`}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                      >
                        {companion.profile.phone}
                      </a>
                    </div>
                  )}
                </div>

                {companion.is_suspended ? (
                  <div className="w-full py-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-500 font-bold text-center text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    ไม่สามารถจองได้ (บัญชีถูกระงับชั่วคราว)
                  </div>
                ) : (
                  <Link
                    href={`/customer/book/${companion.id}`}
                    className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-bold text-center text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Calendar className="w-5 h-5" />
                    จองผู้ช่วยร่วมเดินทาง
                  </Link>
                )}

                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  *ระบบยังไม่มีการตัดเงินทันที ชำระค่าบริการโดยตรงหลังเสร็จสิ้นภารกิจ
                </p>

                {/* Report Companion Button */}
                <div className="pt-2 border-t border-gray-100 flex justify-center">
                  <ReportCompanionButton
                    companionId={companion.id}
                    companionName={companion.profile?.full_name || 'ผู้ช่วยร่วมเดินทาง'}
                    companionAvatar={companionAvatar}
                    className="w-full justify-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
