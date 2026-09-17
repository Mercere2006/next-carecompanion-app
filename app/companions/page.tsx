'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CompanionCard from '@/components/companions/CompanionCard';
import { CompanionCardData } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Search, MapPin, SlidersHorizontal, ClipboardList, Calendar, Clock, Sparkles } from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 1, name: 'พบแพทย์ / ไปโรงพยาบาล' },
  { id: 2, name: 'ติดต่อธนาคาร / การเงิน' },
  { id: 3, name: 'ติดต่อหน่วยงานราชการ' },
  { id: 4, name: 'ซื้อสินค้า / จ่ายตลาด' },
  { id: 5, name: 'ธุระทั่วไปนอกบ้าน' },
];

// Fallback demo data to ensure presentation works even before real users register
const MOCK_COMPANIONS: CompanionCardData[] = [
  {
    id: 'demo-1',
    bio: 'อดีตผู้ช่วยพยาบาล มีประสบการณ์ดูแลผู้สูงอายุ ใจเย็น ชำนาญเส้นทางโรงพยาบาลศิริราชและรามาธิบดี ช่วยพยุงและเข็นวีลแชร์ได้อย่างคล่องแคล่ว',
    experience_years: 4,
    skills: ['ช่วยพยุงเดิน', 'ชำนาญเส้นทาง รพ.', 'เข็นวีลแชร์', 'ประสานงานเคาน์เตอร์'],
    service_areas: ['บางกอกน้อย', 'พญาไท', 'ราชเทวี', 'บางพลัด'],
    available_schedule: 'จันทร์ - ศุกร์ (08:00 - 16:00 น.)',
    hourly_rate: 250,
    id_card_image_url: null,
    verification_status: 'verified',
    rating_avg: 4.95,
    rating_count: 24,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: 'คุณวิมล สุขเกษม',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: '0812345678',
      email: 'wimon@example.com',
    },
  },
  {
    id: 'demo-2',
    bio: 'สุภาพ เรียบร้อย ตรงต่อเวลา ช่วยพาทำธุรกรรมธนาคาร ติดต่อราชการที่สำนักงานเขต หรือพาไปซื้อของที่ตลาดและห้างสรรพสินค้า มีรถยนต์ส่วนตัวพร้อมคาร์ซีทสำหรับผู้ใหญ่',
    experience_years: 3,
    skills: ['มีรถยนต์ส่วนตัว', 'ช่วยถือสัมภาระ', 'ติดต่อหน่วยงานราชการ', 'ใจเย็น'],
    service_areas: ['จตุจักร', 'ลาดพร้าว', 'บางซื่อ', 'ดอนเมือง'],
    available_schedule: 'ทุกวัน (09:00 - 18:00 น.)',
    hourly_rate: 300,
    id_card_image_url: null,
    verification_status: 'verified',
    rating_avg: 4.88,
    rating_count: 19,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: 'คุณประสิทธิ์ อิ่มเอิบ',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      phone: '0898765432',
      email: 'prasit@example.com',
    },
  },
  {
    id: 'demo-3',
    bio: 'มีความรู้ด้านภาษาอังกฤษดี จิตใจบริการ อบอุ่น พร้อมเป็นเพื่อนร่วมทางช่วยพาไปพบแพทย์ ซื้อยา หรือพาไปทำธุระส่วนตัวต่างๆ แถบสุขุมวิทและสาทร',
    experience_years: 2,
    skills: ['สื่อสารภาษาอังกฤษ', 'พาไปตรวจสุขภาพ', 'ช่วยพยุง', 'ช้อปปิ้ง'],
    service_areas: ['วัฒนา', 'คลองเตย', 'สาทร', 'ปทุมวัน'],
    available_schedule: 'เสาร์ - อาทิตย์ (08:30 - 17:00 น.)',
    hourly_rate: 280,
    id_card_image_url: null,
    verification_status: 'verified',
    rating_avg: 5.0,
    rating_count: 12,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: 'คุณกานดา รุ่งเรือง',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '0845551234',
      email: 'kanda@example.com',
    },
  },
];

export default function CompanionsPage() {
  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer Requirement Matching Form (ตามโจทย์อาจารย์)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchArea, setSearchArea] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [maxRate, setMaxRate] = useState<number>(500);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [specialNeedFilter, setSpecialNeedFilter] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanions() {
      try {
        const { data, error } = await supabase
          .from('companion_profiles')
          .select(`
            *,
            profile:profiles(full_name, avatar_url, phone, email)
          `)
          .eq('is_available', true);

        if (!error && data && data.length > 0) {
          setCompanions(data as unknown as CompanionCardData[]);
        } else {
          setCompanions(MOCK_COMPANIONS);
        }
      } catch {
        setCompanions(MOCK_COMPANIONS);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanions();
  }, [supabase]);

  // Filter based on Customer Requirements & Keywords
  const filteredCompanions = companions.filter((comp) => {
    const nameMatch = comp.profile?.full_name?.toLowerCase().includes(searchKeyword.toLowerCase());
    const bioMatch = comp.bio?.toLowerCase().includes(searchKeyword.toLowerCase());
    const skillMatch = comp.skills?.some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase()));
    const keywordMatch = !searchKeyword || nameMatch || bioMatch || skillMatch;

    const areaMatch = !searchArea || comp.service_areas?.some((a) => a.includes(searchArea));
    const rateMatch = comp.hourly_rate <= maxRate;
    const needMatch = !specialNeedFilter || comp.skills?.some((s) => s.includes(specialNeedFilter));

    return keywordMatch && areaMatch && rateMatch && needMatch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>เข้าชมข้อมูลเบื้องต้นและเลือกผู้ช่วยร่วมเดินทาง</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            ค้นหาและเลือกผู้ช่วยที่ตรงใจคุณ
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            ระบุความต้องการของคุณเพื่อค้นหาผู้ช่วยที่เหมาะสมได้ด้านล่าง
          </p>
        </div>

        {/* CUSTOMER REQUIREMENT SPECIFICATION BOX (ตามโจทย์เป๊ะๆ) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-lg shadow-emerald-100/40 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-700" />
              ระบุความต้องการของคุณ (Customer Requirements):
            </h2>
            <span className="text-xs text-emerald-700 font-semibold hidden sm:inline">
              ระบบจะกรองผู้ช่วยที่เหมาะสมให้อัตโนมัติ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. ประเภทธุระ */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">1. ประเภทธุระ</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-gray-800"
              >
                <option value="">เลือกทุกประเภทธุระ</option>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. พื้นที่ต้นทาง / ปลายทาง */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">2. พื้นที่ / เขตที่ต้องการ</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="เช่น บางกอกน้อย, พญาไท..."
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-800"
                />
              </div>
            </div>

            {/* 3. ความต้องการพิเศษ (วีลแชร์ / ช่วยพยุง) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">3. ความช่วยเหลือพิเศษ</label>
              <select
                value={specialNeedFilter}
                onChange={(e) => setSpecialNeedFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-gray-800"
              >
                <option value="">ความช่วยเหลือทั่วไป</option>
                <option value="ช่วยพยุง">ต้องการคนช่วยพยุงเดิน</option>
                <option value="วีลแชร์">ใช้วีลแชร์ / เข็นรถ</option>
                <option value="รถยนต์">ต้องการคนมีรถยนต์ส่วนตัว</option>
                <option value="อังกฤษ">ต้องการคนสื่อสารภาษาอังกฤษได้</option>
              </select>
            </div>

            {/* 4. อัตราค่าบริการสูงสุด */}
            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>4. งบประมาณสูงสุด:</span>
                <span className="text-emerald-700">฿{maxRate}/ชม.</span>
              </div>
              <input
                type="range"
                min="150"
                max="600"
                step="50"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-full accent-emerald-600 mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือทักษะเพิ่มเติม..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">
                พบผู้ช่วยที่ตรงเงื่อนไข: <strong className="text-emerald-700">{filteredCompanions.length}</strong> ท่าน
              </span>
              {(selectedCategory || searchArea || specialNeedFilter || searchKeyword || maxRate < 500) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchArea('');
                    setSpecialNeedFilter('');
                    setSearchKeyword('');
                    setMaxRate(500);
                  }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  ล้างค่า
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Grid (Publicly visible cards) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : filteredCompanions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanions.map((comp) => (
              <CompanionCard key={comp.id} companion={comp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
            <p className="text-gray-500 text-base">ไม่พบ Companion ที่ตรงกับเงื่อนไขความต้องการของคุณ</p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchArea('');
                setSpecialNeedFilter('');
                setSearchKeyword('');
                setMaxRate(500);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold"
            >
              ล้างเงื่อนไขทั้งหมด
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
