'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LocationPicker from '@/components/maps/LocationPicker';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import { Calendar, Clock, HeartHandshake, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const SERVICE_CATEGORIES = [
  { id: 1, name: 'พบแพทย์ / ไปโรงพยาบาล' },
  { id: 2, name: 'ติดต่อธนาคาร / การเงิน' },
  { id: 3, name: 'ติดต่อหน่วยงานราชการ' },
  { id: 4, name: 'ซื้อสินค้า / จ่ายตลาด' },
  { id: 5, name: 'ธุระทั่วไปนอกบ้าน' },
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const companionId = resolvedParams.companionId;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [companionRate, setCompanionRate] = useState(250);
  const [companionName, setCompanionName] = useState('ผู้ช่วยร่วมเดินทาง');

  // Form states
  const [categoryId, setCategoryId] = useState(1);
  const [errandTitle, setErrandTitle] = useState('');
  const [errandDetails, setErrandDetails] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originLat, setOriginLat] = useState<number | null>(13.7563);
  const [originLng, setOriginLng] = useState<number | null>(100.5018);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLat, setDestinationLat] = useState<number | null>(13.7578);
  const [destinationLng, setDestinationLng] = useState<number | null>(100.4855);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(3);
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate total price
  const totalPrice = durationHours * companionRate;

  useEffect(() => {
    async function loadData() {
      // 1. Check user auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Must sign in
        setUser(null);
      } else {
        setUser(user);
      }

      // 2. Load companion info
      if (!companionId.startsWith('demo-')) {
        const { data: comp } = await supabase
          .from('companion_profiles')
          .select(`
            hourly_rate,
            profile:profiles(full_name)
          `)
          .eq('id', companionId)
          .single();

        if (comp) {
          setCompanionRate(Number(comp.hourly_rate) || 250);
          const profileData = comp.profile as { full_name?: string } | null;
          if (profileData?.full_name) {
            setCompanionName(profileData.full_name);
          }
        }
      }

      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);

      setLoading(false);
    }

    loadData();
  }, [companionId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('กรุณาเข้าสู่ระบบด้วย Google ก่อนทำการจองบริการ');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      return;
    }

    if (!errandTitle.trim() || !originAddress.trim() || !destinationAddress.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลธุระและสถานที่ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Create Booking in Supabase
      const { error } = await supabase.from('bookings').insert({
        customer_id: user.id,
        companion_id: companionId.startsWith('demo-') ? user.id : companionId,
        category_id: categoryId,
        errand_title: errandTitle,
        errand_details: errandDetails,
        origin_address: originAddress,
        origin_lat: originLat,
        origin_lng: originLng,
        destination_address: destinationAddress,
        destination_lat: destinationLat,
        destination_lng: destinationLng,
        appointment_date: appointmentDate,
        start_time: startTime,
        duration_hours: durationHours,
        special_needs: specialNeeds,
        total_price: totalPrice,
        status: 'pending',
      });

      if (error) throw error;

      alert('สร้างคำขอจองบริการเรียบร้อยแล้ว! กำลังนำคุณไปยังหน้าติดตามสถานะ');
      router.push('/customer/dashboard');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างคำขอ');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href={`/companions/${companionId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับไปดูโปรไฟล์ผู้ช่วย
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-lg space-y-8">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Booking Request
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-2">
                นัดหมายผู้ช่วยร่วมเดินทาง
              </h1>
              <p className="text-sm text-gray-600">
                ผู้ช่วยของคุณ: <strong className="text-emerald-700">{companionName}</strong> ({formatPrice(companionRate)}/ชม.)
              </p>
            </div>
            <div className="text-right bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-medium block">ประเมินราคารวม</span>
              <span className="text-2xl font-black text-emerald-700">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Ethical Disclaimer Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>คำเตือนด้านความปลอดภัย:</strong> Companion มีหน้าที่อำนวยความสะดวกในการเดินทางและช่วยทำธุระเท่านั้น ไม่ใช่ผู้ให้บริการทางการแพทย์ หากผู้เดินทางมีโรคประจำตัวร้ายแรงหรือต้องการการดูแลพยาบาล กรุณามีผู้ดูแลหลักร่วมเดินทางด้วย
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Category */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                1. ประเภทธุระที่ต้องการใช้บริการ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition flex items-center justify-between ${
                      categoryId === cat.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {categoryId === cat.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Title & Details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-900">
                  2. หัวข้อธุระ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={errandTitle}
                  onChange={(e) => setErrandTitle(e.target.value)}
                  placeholder="เช่น พาคุณแม่ไปตรวจเบาหวานตามนัด รพ.ศิริราช"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-900">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={errandDetails}
                  onChange={(e) => setErrandDetails(e.target.value)}
                  placeholder="เช่น ต้องเจาะเลือดก่อน 8:30 น., นัดแพทย์ตึกสยามินทร์ ชั้น 4"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
                />
              </div>
            </div>

            {/* 3. Locations with Map Pinning */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">
                3. ระบุสถานที่และปักหมุดแผนที่ <span className="text-rose-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LocationPicker
                  label="จุดเริ่มต้น / จุดรับผู้เดินทาง"
                  pinColor="green"
                  address={originAddress}
                  lat={originLat}
                  lng={originLng}
                  onAddressChange={setOriginAddress}
                  onCoordinatesChange={(lat, lng) => {
                    setOriginLat(lat);
                    setOriginLng(lng);
                  }}
                  placeholder="เช่น คอนโด ลุมพินี พาร์ค พระราม 9"
                />

                <LocationPicker
                  label="จุดหมายปลายทาง / จุดส่ง"
                  pinColor="red"
                  address={destinationAddress}
                  lat={destinationLat}
                  lng={destinationLng}
                  onAddressChange={setDestinationAddress}
                  onCoordinatesChange={(lat, lng) => {
                    setDestinationLat(lat);
                    setDestinationLng(lng);
                  }}
                  placeholder="เช่น โรงพยาบาลศิริราช ตึกสยามินทร์"
                />
              </div>
            </div>

            {/* 4. Date, Time & Duration */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900">
                4. วัน เวลา และระยะเวลาที่ต้องการใช้บริการ <span className="text-rose-500">*</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    วันที่นัดหมาย
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    เวลาเริ่มนัดหมาย
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    ระยะเวลา (ชั่วโมง)
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} ชั่วโมง ({formatPrice(h * companionRate)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Special Needs */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                5. ความช่วยเหลือพิเศษ (ถ้ามี)
              </label>
              <input
                type="text"
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder="เช่น ใช้วีลแชร์ของตนเอง, เดินช้าต้องช่วยพยุง, ช่วยถือถุงของหนัก"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500 block">ยอดรวมทั้งสิ้น (ชำระหลังเสร็จสิ้นภารกิจ)</span>
                <span className="text-3xl font-black text-emerald-700">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <HeartHandshake className="w-5 h-5" />
                {submitting ? 'กำลังส่งคำขอ...' : 'ยืนยันการส่งคำขอจอง'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
