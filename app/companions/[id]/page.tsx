import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { ShieldCheck, Star, MapPin, Briefcase, Calendar, Phone, ArrowLeft, HeartHandshake, User } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function CompanionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try to load companion from Supabase
  let companion = null;
  const { data } = await supabase
    .from('companion_profiles')
    .select(`
      *,
      profile:profiles(full_name, avatar_url, phone, email)
    `)
    .eq('id', id)
    .single();

  if (data) {
    companion = data;
  } else if (id.startsWith('demo-')) {
    // Demo fallback for instant presentation/testing
    companion = {
      id,
      bio: 'อดีตผู้ช่วยพยาบาล มีประสบการณ์ดูแลผู้สูงอายุ ใจเย็น ชำนาญเส้นทางโรงพยาบาลศิริราชและรามาธิบดี ช่วยพยุงและเข็นวีลแชร์ได้อย่างคล่องแคล่ว พร้อมอำนวยความสะดวกตลอดการเดินทาง',
      experience_years: 4,
      skills: ['ช่วยพยุงเดิน', 'ชำนาญเส้นทาง รพ.', 'เข็นวีลแชร์', 'ประสานงานเคาน์เตอร์', 'ภาษาอังกฤษเบื้องต้น'],
      service_areas: ['บางกอกน้อย', 'พญาไท', 'ราชเทวี', 'บางพลัด', 'ดินแดง'],
      hourly_rate: 250,
      verification_status: 'verified',
      rating_avg: 4.95,
      rating_count: 24,
      is_available: true,
      profile: {
        full_name: 'คุณวิมล สุขเกษม',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        phone: '081-234-5678',
        email: 'wimon@carecompanion.example',
      },
    };
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <Link
          href="/companions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับไปหน้ารายชื่อ Companion
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-24 h-24 rounded-3xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-300 shrink-0 shadow-sm">
                  {companion.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={companion.profile.avatar_url}
                      alt={companion.profile.full_name || 'Companion'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-emerald-600" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                      {companion.profile?.full_name}
                    </h1>
                    {companion.verification_status === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    ผู้ให้บริการร่วมเดินทาง (Companion)
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
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
                  <ShieldCheck className="w-4 h-4" />
                  <span>ตรวจสอบประวัติและบัตรประชาชนแล้ว</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-teal-600" />
                  <span>ช่วยเหลืออำนวยความสะดวกตลอดการเดินทาง</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  <span>ติดต่อผู้ช่วยได้ทันทีหลังยืนยันการจอง</span>
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
