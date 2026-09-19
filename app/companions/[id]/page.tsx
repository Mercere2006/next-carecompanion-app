import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
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
} from 'lucide-react';
import { notFound } from 'next/navigation';

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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check customer login state for privacy-gated data (phone, full license plate)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

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
    companion = data as unknown as CompanionCardData;
  } else {
    notFound();
  }

  // Fetch reviews for this companion
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      customer:profiles(full_name, avatar_url)
    `)
    .eq('companion_id', id)
    .order('created_at', { ascending: false });

  const vehicleType = companion.vehicle_type || 'none';
  const hasVehicle = vehicleType === 'car' || vehicleType === 'motorcycle';

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
                  หมายเลขโทรศัพท์และหมายเลขทะเบียนรถฉบับเต็มถูกปิดบังไว้ เพื่อความเป็นส่วนตัวและความปลอดภัยของผู้ให้บริการ
                </p>
              </div>
            </div>
            <Link
              href={`/login?redirect=/companions/${id}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition active:scale-95 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบเพื่อดูข้อมูลทั้งหมด
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Profile Info (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-200/80 shadow-xs space-y-5 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-300 shrink-0 shadow-sm">
                  {companion.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={companion.profile.avatar_url}
                      alt={companion.profile.full_name || 'Companion'}
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
                    <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" />
                      {Number(companion.rating_avg).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{companion.rating_count} รีวิว</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      ประสบการณ์ {companion.experience_years} ปี
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="border-t border-gray-100 pt-5 space-y-2">
                <h2 className="text-base font-bold text-gray-900">เกี่ยวกับผู้ช่วย</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {companion.bio || 'ยังไม่มีคำแนะนำตัว'}
                </p>
              </div>

              {/* Vehicle & Transportation Details (Grab-style Transport Card) */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {vehicleType === 'car' ? (
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
                      vehicleType === 'car'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vehicleType === 'motorcycle'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {vehicleType === 'car'
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
                  {hasVehicle ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">ยี่ห้อ / รุ่น / สี</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {companion.vehicle_model || 'ไม่ระบุรุ่น'}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500 font-medium">หมายเลขทะเบียนรถ</p>
                          {currentUser ? (
                            <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                              <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                                {companion.vehicle_plate || 'ระบุแล้วในระบบ'}
                              </span>
                              <span className="text-[11px] text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ยืนยันแล้ว
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 sm:justify-end mt-0.5">
                              <span className="font-mono text-sm text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-300">
                                {maskPlate(companion.vehicle_plate)}
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                รีวิวและความคิดเห็นจากผู้ใช้งาน ({companion.rating_count})
              </h2>

              {reviews && reviews.length > 0 ? (
                <div className="space-y-4 divide-y divide-gray-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-800">
                          {rev.customer?.full_name || 'ลูกค้าที่ใช้บริการ'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  ยังไม่มีรีวิวสำหรับผู้ช่วยท่านนี้
                </p>
              )}
            </div>
          </div>

          {/* Right Booking Action Card (Col 3) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-xl shadow-emerald-100/50 sticky top-28 space-y-6">
              <div className="flex items-baseline justify-between pb-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-500">อัตราค่าบริการ</span>
                <div>
                  <span className="text-3xl font-black text-emerald-700">
                    {formatPrice(companion.hourly_rate)}
                  </span>
                  <span className="text-xs text-gray-400 font-medium ml-1">/ ชั่วโมง</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>ยืนยันใบหน้าจริง & เบอร์โทรศัพท์ (OTP) แล้ว</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  {vehicleType === 'car' ? (
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

                {/* Contact Phone (Privacy Gated) */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    เบอร์ติดต่อ:
                  </span>
                  {currentUser ? (
                    <a
                      href={`tel:${companion.profile?.phone || ''}`}
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      {companion.profile?.phone || 'ไม่ระบุเบอร์'}
                    </a>
                  ) : (
                    <span className="font-mono text-gray-400 flex items-center gap-1">
                      {maskPhoneNumber(companion.profile?.phone)}
                      <Lock className="w-3 h-3 text-amber-600 ml-0.5" />
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/customer/book/${companion.id}`}
                className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-bold text-center text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98"
              >
                <Calendar className="w-5 h-5" />
                จองผู้ช่วยร่วมเดินทาง
              </Link>

              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                *ระบบยังไม่มีการตัดเงินทันที ชำระค่าบริการโดยตรงหลังเสร็จสิ้นภารกิจ
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
