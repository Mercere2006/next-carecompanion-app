"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanionCard from "@/components/companions/CompanionCard";
import { CompanionCardData } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  MapPin,
  ClipboardList,
  LogIn,
  X,
  HeartHandshake,
} from "lucide-react";
import ComboboxSelect, { ComboboxOption } from "@/components/ui/ComboboxSelect";

export const SERVICE_CATEGORIES = [
  { id: 1, name: "พบแพทย์ / ไปโรงพยาบาล" },
  { id: 2, name: "ติดต่อธนาคาร / การเงิน" },
  { id: 3, name: "ติดต่อหน่วยงานราชการ" },
  { id: 4, name: "ซื้อสินค้า / จ่ายตลาด" },
  { id: 5, name: "ธุระทั่วไปนอกบ้าน" },
];

export const CATEGORY_OPTIONS: ComboboxOption[] = [
  { label: "ธุระทั่วไป (โปรดระบุ)", value: "ธุระทั่วไป" },
  { label: "พบแพทย์ / ไปโรงพยาบาล", value: "พบแพทย์ / ไปโรงพยาบาล" },
  { label: "ติดต่อธนาคาร / การเงิน", value: "ติดต่อธนาคาร / การเงิน" },
  { label: "ติดต่อหน่วยงานราชการ", value: "ติดต่อหน่วยงานราชการ" },
  { label: "ซื้อสินค้า / จ่ายตลาด", value: "ซื้อสินค้า / จ่ายตลาด" },
];

export const SPECIAL_NEED_OPTIONS: ComboboxOption[] = [
  { label: "ความช่วยเหลือทั่วไป (โปรดระบุ)", value: "ความช่วยเหลือทั่วไป" },
  { label: "ต้องการคนช่วยพยุงเดิน", value: "ต้องการคนช่วยพยุงเดิน" },
  { label: "ใช้วีลแชร์ / เข็นรถ", value: "ใช้วีลแชร์ / เข็นรถ" },
  { label: "ต้องการคนมีรถยนต์ส่วนตัว", value: "ต้องการคนมีรถยนต์ส่วนตัว" },
  {
    label: "ต้องการคนสื่อสารภาษาอังกฤษได้",
    value: "ต้องการคนสื่อสารภาษาอังกฤษได้",
  },
];

export const MOCK_COMPANIONS: CompanionCardData[] = [
  {
    id: "demo-1",
    bio: "อดีตผู้ช่วยพยาบาล มีประสบการณ์ดูแลผู้สูงอายุ ใจเย็น ชำนาญเส้นทางโรงพยาบาลศิริราชและรามาธิบดี ช่วยพยุงและเข็นวีลแชร์ได้อย่างคล่องแคล่ว",
    experience_years: 4,
    skills: [
      "ช่วยพยุงเดิน",
      "ชำนาญเส้นทาง รพ.",
      "เข็นวีลแชร์",
      "ประสานงานเคาน์เตอร์",
    ],
    service_areas: ["บางกอกน้อย", "พญาไท", "ราชเทวี", "บางพลัด"],
    available_schedule: "จันทร์ - ศุกร์ (08:00 - 16:00 น.)",
    hourly_rate: 250,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 4.95,
    rating_count: 24,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: "คุณวิมล สุขเกษม",
      avatar_url:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      phone: "0812345678",
      email: "wimon@example.com",
    },
  },
  {
    id: "demo-2",
    bio: "สุภาพ เรียบร้อย ตรงต่อเวลา ช่วยพาทำธุรกรรมธนาคาร ติดต่อราชการที่สำนักงานเขต หรือพาไปซื้อของที่ตลาดและห้างสรรพสินค้า มีรถยนต์ส่วนตัวพร้อมคาร์ซีทสำหรับผู้ใหญ่",
    experience_years: 3,
    skills: [
      "มีรถยนต์ส่วนตัว",
      "ช่วยถือสัมภาระ",
      "ติดต่อหน่วยงานราชการ",
      "ใจเย็น",
    ],
    service_areas: ["จตุจักร", "ลาดพร้าว", "บางซื่อ", "ดอนเมือง"],
    available_schedule: "ทุกวัน (09:00 - 18:00 น.)",
    hourly_rate: 300,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 4.88,
    rating_count: 19,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: "คุณประสิทธิ์ อิ่มเอิบ",
      avatar_url:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      phone: "0898765432",
      email: "prasit@example.com",
    },
  },
  {
    id: "demo-3",
    bio: "มีความรู้ด้านภาษาอังกฤษดี จิตใจบริการ อบอุ่น พร้อมเป็นเพื่อนร่วมทางช่วยพาไปพบแพทย์ ซื้อยา หรือพาไปทำธุระส่วนตัวต่างๆ แถบสุขุมวิทและสาทร",
    experience_years: 2,
    skills: ["สื่อสารภาษาอังกฤษ", "พาไปตรวจสุขภาพ", "ช่วยพยุง", "ช้อปปิ้ง"],
    service_areas: ["วัฒนา", "คลองเตย", "สาทร", "ปทุมวัน"],
    available_schedule: "เสาร์ - อาทิตย์ (08:30 - 17:00 น.)",
    hourly_rate: 280,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 5.0,
    rating_count: 12,
    is_available: true,
    updated_at: new Date().toISOString(),
    profile: {
      full_name: "คุณกานดา รุ่งเรือง",
      avatar_url:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      phone: "0845551234",
      email: "kanda@example.com",
    },
  },
];

interface CompanionSearchSectionProps {
  id?: string;
  className?: string;
}

export default function CompanionSearchSection({
  id = "search-companions",
  className = "",
}: CompanionSearchSectionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Customer Requirement Matching Form
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchArea, setSearchArea] = useState<string>("");
  const [maxRate, setMaxRate] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [specialNeedFilter, setSpecialNeedFilter] = useState<string>("");

  // Auth gate modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCompanionForBooking, setSelectedCompanionForBooking] =
    useState<CompanionCardData | null>(null);

  useEffect(() => {
    async function loadInitial() {
      // 1. Check user auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user ? { id: user.id } : null);

      // 2. Fetch companions
      try {
        const { data, error } = await supabase
          .from("companion_profiles")
          .select(
            `
            *,
            profile:profiles(full_name, avatar_url, phone, email)
          `,
          )
          .eq("is_available", true);

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

    loadInitial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? { id: session.user.id } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Filter based on Customer Requirements & Keywords
  const filteredCompanions = companions.filter((comp) => {
    const nameMatch = comp.profile?.full_name
      ?.toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const bioMatch = comp.bio
      ?.toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const skillMatch = comp.skills?.some((s) =>
      s.toLowerCase().includes(searchKeyword.toLowerCase()),
    );
    const keywordMatch = !searchKeyword || nameMatch || bioMatch || skillMatch;

    const areaMatch =
      !searchArea || comp.service_areas?.some((a) => a.includes(searchArea));
    const rateMatch = !maxRate || comp.hourly_rate <= Number(maxRate);

    // Smart category matching (supports preset selection & freeform text)
    const categoryMatch =
      !selectedCategory.trim() ||
      (() => {
        const cat = selectedCategory.trim().toLowerCase();
        if (!cat || cat === "เลือกทุกประเภทธุระ" || cat === "ธุระทั่วไปนอกบ้าน")
          return true;
        if (
          cat.includes("แพทย์") ||
          cat.includes("โรงพยาบาล") ||
          cat.includes("รพ.")
        ) {
          return (
            comp.bio?.includes("พยาบาล") ||
            comp.bio?.includes("รพ.") ||
            comp.bio?.includes("แพทย์") ||
            comp.skills?.some(
              (s) =>
                s.includes("รพ.") ||
                s.includes("แพทย์") ||
                s.includes("สุขภาพ"),
            )
          );
        }
        if (cat.includes("ธนาคาร") || cat.includes("การเงิน")) {
          return (
            comp.bio?.includes("ธนาคาร") ||
            comp.skills?.some((s) => s.includes("ธนาคาร"))
          );
        }
        if (cat.includes("ราชการ")) {
          return (
            comp.bio?.includes("ราชการ") ||
            comp.skills?.some((s) => s.includes("ราชการ"))
          );
        }
        if (
          cat.includes("ซื้อ") ||
          cat.includes("ตลาด") ||
          cat.includes("ช้อป")
        ) {
          return (
            comp.bio?.includes("ซื้อ") ||
            comp.bio?.includes("ตลาด") ||
            comp.skills?.some(
              (s) => s.includes("ช้อป") || s.includes("สัมภาระ"),
            )
          );
        }
        // If custom text was typed
        const matchesCustom =
          comp.bio?.toLowerCase().includes(cat) ||
          comp.skills?.some((s) => s.toLowerCase().includes(cat));
        const anyOneMatches = companions.some(
          (c) =>
            c.bio?.toLowerCase().includes(cat) ||
            c.skills?.some((s) => s.toLowerCase().includes(cat)),
        );
        return anyOneMatches ? matchesCustom : true;
      })();

    // Smart special need matching (supports preset selection & freeform text)
    const needMatch =
      !specialNeedFilter.trim() ||
      (() => {
        const need = specialNeedFilter.trim().toLowerCase();
        if (!need || need === "ความช่วยเหลือทั่วไป" || need.includes("ไม่ระบุ"))
          return true;
        if (need.includes("พยุง"))
          return (
            comp.skills?.some((s) => s.includes("พยุง")) ||
            comp.bio?.includes("พยุง")
          );
        if (need.includes("วีลแชร์") || need.includes("รถเข็น"))
          return (
            comp.skills?.some((s) => s.includes("วีลแชร์")) ||
            comp.bio?.includes("วีลแชร์")
          );
        if (
          need.includes("รถยนต์") ||
          need.includes("ขับรถ") ||
          need.includes("คาร์")
        )
          return (
            comp.skills?.some((s) => s.includes("รถยนต์")) ||
            comp.bio?.includes("รถยนต์")
          );
        if (need.includes("อังกฤษ") || need.includes("english"))
          return (
            comp.skills?.some((s) => s.includes("อังกฤษ")) ||
            comp.bio?.includes("อังกฤษ")
          );
        // If custom text was typed
        const matchesCustom =
          comp.skills?.some((s) => s.toLowerCase().includes(need)) ||
          comp.bio?.toLowerCase().includes(need);
        const anyOneMatches = companions.some(
          (c) =>
            c.skills?.some((s) => s.toLowerCase().includes(need)) ||
            c.bio?.toLowerCase().includes(need),
        );
        return anyOneMatches ? matchesCustom : true;
      })();

    return keywordMatch && areaMatch && rateMatch && categoryMatch && needMatch;
  });

  // Build target booking URL with pre-filled query params
  const getBookingUrl = (companionId: string) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchArea) params.set("area", searchArea);
    if (specialNeedFilter) params.set("need", specialNeedFilter);
    const queryString = params.toString();
    return `/customer/book/${companionId}${queryString ? `?${queryString}` : ""}`;
  };

  // Handle Companion Selection
  const handleSelectCompanion = async (companion: CompanionCardData) => {
    // Save pending requirements to sessionStorage for extra reliability
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "pending_booking_requirements",
        JSON.stringify({
          companionId: companion.id,
          category: selectedCategory,
          area: searchArea,
          need: specialNeedFilter,
        }),
      );
    }

    // Check fresh auth state
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Must login first
      setSelectedCompanionForBooking(companion);
      setShowLoginModal(true);
      return;
    }

    // User is logged in, navigate to booking page with parameters
    const targetUrl = getBookingUrl(companion.id);
    router.push(targetUrl);
  };

  // Handle Google Login from Modal
  const handleModalGoogleLogin = async () => {
    if (!selectedCompanionForBooking) return;
    const targetUrl = getBookingUrl(selectedCompanionForBooking.id);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetUrl)}`,
      },
    });
  };

  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight break-words">
            เลือกผู้ช่วยที่ตรงกับความต้องการของคุณ
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            ระบุประเภทธุระ พื้นที่ และความช่วยเหลือพิเศษ
            เพื่อให้ระบบกรองผู้ข่วยที่เหมาะสมที่สุดให้คุณ
          </p>
        </div>

        {/* CUSTOMER REQUIREMENT SPECIFICATION BOX */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-emerald-100 shadow-xl shadow-emerald-100/40 space-y-5 sm:space-y-6 min-w-0 relative z-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 min-w-0">
            <h3 className="text-xs sm:text-base font-bold text-gray-900 flex items-center gap-2 min-w-0 flex-wrap">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
              <span className="break-words">
                ระบุความต้องการของคุณ (Customer Requirements):
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. ประเภทธุระ */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-gray-700">
                1. ประเภทธุระ
              </label>
              <ComboboxSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={CATEGORY_OPTIONS}
                placeholder="เลือก หรือพิมพ์ประเภทธุระ..."
              />
            </div>

            {/* 2. พื้นที่ต้นทาง / ปลายทาง */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-gray-700">
                2. พื้นที่ / เขตที่ต้องการ
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="เช่น บางกอกน้อย, พญาไท..."
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* 3. ความต้องการพิเศษ (วีลแชร์ / ช่วยพยุง) */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-gray-700">
                3. ความช่วยเหลือพิเศษ
              </label>
              <ComboboxSelect
                value={specialNeedFilter}
                onChange={(val) => setSpecialNeedFilter(val)}
                options={SPECIAL_NEED_OPTIONS}
                placeholder="เลือก หรือพิมพ์ความช่วยเหลือ..."
              />
            </div>

            {/* 4. อัตราค่าบริการ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                4. งบประมาณ
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs sm:text-sm font-bold text-emerald-700">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="เช่น 300, 500"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-full pl-8 pr-14 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium pointer-events-none">
                  /ชม.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือทักษะเพิ่มเติม..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-semibold text-gray-700">
                พบผู้ช่วย:{" "}
                <strong className="text-emerald-700 text-sm">
                  {filteredCompanions.length}
                </strong>{" "}
                ท่าน
              </span>
              {(selectedCategory ||
                searchArea ||
                specialNeedFilter ||
                searchKeyword ||
                maxRate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchArea("");
                    setSpecialNeedFilter("");
                    setSearchKeyword("");
                    setMaxRate("");
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  ล้างค่า
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 bg-white rounded-3xl animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : filteredCompanions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanions.map((comp) => (
              <CompanionCard
                key={comp.id}
                companion={comp}
                onSelect={handleSelectCompanion}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
            <p className="text-gray-500 text-base">
              ไม่พบผู้ช่วยที่ตรงกับเงื่อนไขความต้องการของคุณในขณะนี้
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setSearchArea("");
                setSpecialNeedFilter("");
                setSearchKeyword("");
                setMaxRate("");
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold hover:bg-emerald-200 transition cursor-pointer"
            >
              ล้างเงื่อนไขทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginModal && selectedCompanionForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-gray-100 space-y-5 sm:space-y-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <LogIn className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                เข้าสู่ระบบก่อนดำเนินการจอง
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                กรุณาเข้าสู่ระบบด้วย Google
                เพื่อยืนยันตัวตนและความปลอดภัยในการนัดหมายผู้ช่วยร่วมเดินทาง
              </p>
            </div>

            {/* Selected Companion Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0">
                {selectedCompanionForBooking.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedCompanionForBooking.profile.avatar_url}
                    alt={
                      selectedCompanionForBooking.profile.full_name ||
                      "Companion"
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HeartHandshake className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs text-gray-500 font-medium">
                  ผู้ช่วยที่คุณเลือก:
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {selectedCompanionForBooking.profile?.full_name}
                </p>
                <p className="text-xs text-emerald-700 font-bold">
                  ฿{selectedCompanionForBooking.hourly_rate}/ชม.
                </p>
              </div>
            </div>

            {/* Google Login CTA */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleModalGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-98 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 bg-white rounded-full p-0.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                เข้าสู่ระบบด้วย Google เพื่อจอง
              </button>

              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2.5 text-sm text-gray-500 font-semibold hover:text-gray-800 transition cursor-pointer"
              >
                ไว้คราวหลัง
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
