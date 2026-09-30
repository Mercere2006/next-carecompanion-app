"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  X,
  Stethoscope,
  Landmark,
  FileText,
  ShoppingBag,
  Compass,
} from "lucide-react";
import CompanionCard from "@/components/companions/CompanionCard";
import { CompanionCardData } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { formatThaiDate } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  extractSuspendedUntil,
  isSuspensionExpired,
  autoUnsuspendCompanion,
} from "@/lib/suspensionUtils";
import { fetchActiveCompanionBookingsMap } from "@/lib/availabilityUtils";
import {
  ERRAND_CATEGORIES,
  ErrandCategoryDef,
  getCompanionCategories,
} from "@/lib/categoryUtils";
import { useCompanionFilter } from "./search/useCompanionFilter";
import LoginRequiredModal from "./search/LoginRequiredModal";

import {
  SERVICE_CATEGORIES,
  CATEGORY_OPTIONS,
  SPECIAL_NEED_OPTIONS,
  MOCK_COMPANIONS,
} from "./search/constants";

// Re-export constants for full backward compatibility
export {
  SERVICE_CATEGORIES,
  CATEGORY_OPTIONS,
  SPECIAL_NEED_OPTIONS,
  MOCK_COMPANIONS,
};

interface CompanionSearchSectionProps {
  id?: string;
  className?: string;
}

export default function CompanionSearchSection({
  id = "search-companions",
  className = "",
}: CompanionSearchSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth gate modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCompanionForBooking, setSelectedCompanionForBooking] =
    useState<CompanionCardData | null>(null);

  // View mode: 'grouped' (organized by errand category) vs 'grid' (all in single grid)
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');

  // Hook for filtering & search states
  const {
    selectedCategory,
    setSelectedCategory,
    searchArea,
    setSearchArea,
    specialNeedFilter,
    setSpecialNeedFilter,
    maxRate,
    setMaxRate,
    searchKeyword,
    setSearchKeyword,
    excludeId,
    setExcludeId,
    appointmentDate,
    setAppointmentDate,
    startTime,
    setStartTime,
    onlyAvailableSchedule,
    setOnlyAvailableSchedule,
    availabilityFilter,
    setAvailabilityFilter,
    filteredCompanions,
    hasActiveFilters,
    resetFilters,
  } = useCompanionFilter(companions);

  // Errand Category active check & helpers
  const isCategoryActive = (catId: number) => {
    if (!selectedCategory || selectedCategory === "all" || selectedCategory === "ทั้งหมด") {
      return false;
    }
    const raw = String(selectedCategory).trim().toLowerCase();
    if (raw === String(catId)) return true;
    const cat = ERRAND_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return false;
    return (
      raw === cat.slug.toLowerCase() ||
      raw.includes(cat.name.toLowerCase()) ||
      cat.name.toLowerCase().includes(raw) ||
      raw.includes(cat.shortName.toLowerCase())
    );
  };

  const isAllCategoriesActive =
    !selectedCategory ||
    selectedCategory === "all" ||
    selectedCategory === "0" ||
    selectedCategory === "ทั้งหมด" ||
    selectedCategory === "เลือกทุกประเภทธุระ";

  const activeCategoryDef = ERRAND_CATEGORIES.find((c) => isCategoryActive(c.id));

  const getCategoryCount = (catId?: number) => {
    if (!catId) return filteredCompanions.length;
    return companions.filter((comp) => {
      const matchesKw =
        !searchKeyword ||
        comp.profile?.full_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        comp.bio?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        comp.skills?.some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase()));

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && !comp.is_busy && !comp.is_suspended && comp.is_available) ||
        (availabilityFilter === "busy" && Boolean(comp.is_busy));

      const matchesCategory = getCompanionCategories(comp).some((c) => c.id === catId);

      return matchesKw && matchesAvailability && matchesCategory;
    }).length;
  };

  const handleCategorySelect = (catId?: number) => {
    if (!catId) {
      setSelectedCategory("");
    } else {
      setSelectedCategory(String(catId));
    }
  };

  const getCategoryEmoji = (id: number | string) => {
    switch (id) {
      case 1:
      case "hospital":
        return "🏥";
      case 2:
      case "bank":
        return "🏦";
      case 3:
      case "government":
        return "🏛️";
      case 4:
      case "market":
        return "🛒";
      case 5:
      case "general":
        return "📍";
      default:
        return "🌟";
    }
  };

  // Sync URL search parameters on mount / change
  useEffect(() => {
    if (!searchParams) return;
    const excludeParam = searchParams.get('exclude');
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    const catParam = searchParams.get('category');
    const areaParam = searchParams.get('area');
    const needParam = searchParams.get('need');

    if (excludeParam) setExcludeId(excludeParam);
    if (dateParam) setAppointmentDate(dateParam);
    if (timeParam) setStartTime(timeParam);
    if (catParam) setSelectedCategory(catParam);
    if (areaParam) setSearchArea(areaParam);
    if (needParam) setSpecialNeedFilter(needParam);
  }, [
    searchParams,
    setExcludeId,
    setAppointmentDate,
    setStartTime,
    setSelectedCategory,
    setSearchArea,
    setSpecialNeedFilter,
  ]);

  const loadInitial = useCallback(async () => {
    // 1. Check user auth & role
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user ? { id: user.id } : null);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "admin") {
        setIsAdmin(true);
      }
    }

    // 2. Fetch active bookings map to detect busy companions
    const busyMap = await fetchActiveCompanionBookingsMap(supabase);

    // 3. Fetch companions from DB and merge with fallback companions
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

      if (error) {
        console.warn("Companion profiles query notice:", error.message);
      }

      if (!error && data && data.length > 0) {
        // Enrich hourly_rate from vehicle or bio if DB column has 0 & assign is_busy status
        const enriched = (data as unknown as CompanionCardData[]).map((c) => {
          let rate = Number(c.hourly_rate) || 0;
          if (rate <= 0 && c.vehicle_model) {
            const match = c.vehicle_model.match(/\[฿(\d+)\]/);
            if (match && match[1]) rate = parseInt(match[1], 10);
          }
          if (rate <= 0 && c.bio) {
            const match = c.bio.match(/\[฿(\d+)\]/);
            if (match && match[1]) rate = parseInt(match[1], 10);
          }

          const activeBookingStatus = busyMap.get(c.id) || (c.is_busy ? 'in_progress' : null);
          const isBusy = Boolean(c.is_busy || busyMap.has(c.id));

          return {
            ...c,
            hourly_rate: rate > 0 ? rate : c.hourly_rate,
            is_busy: isBusy,
            active_booking_status: activeBookingStatus,
          };
        });

        // กรองเฉพาะ Companion ที่กรอกข้อมูลครบถ้วนจริง ๆ (มีชื่อ, เรทราคา > 0, มี bio, เปิดรับงาน และไม่ถูกระงับ)
        const completeProfiles = enriched.filter((c) => {
          const hasName = Boolean(
            c.profile?.full_name && c.profile.full_name.trim().length > 0,
          );
          const hasRate = Number(c.hourly_rate) > 0;
          const hasBio = Boolean(c.bio && c.bio.trim().length > 0);
          let notSuspended = !c.is_suspended;

          if (c.is_suspended) {
            const until = extractSuspendedUntil(c);
            if (until && isSuspensionExpired(until)) {
              // Auto-unsuspend in background
              autoUnsuspendCompanion(supabase, c.id, Number(c.rating_avg));
              c.is_suspended = false;
              notSuspended = true;
            }
          }

          const isAvail = c.is_available === true || notSuspended;
          return isAvail && notSuspended && hasRate && hasBio && hasName;
        });

        const realIds = new Set(completeProfiles.map((c) => c.id));
        const complementaryMocks = MOCK_COMPANIONS.filter(
          (m) => !realIds.has(m.id),
        ).map((m) => ({
          ...m,
          is_busy: Boolean(m.is_busy || busyMap.has(m.id)),
          active_booking_status: busyMap.get(m.id) || m.active_booking_status || null,
        }));

        setCompanions([
          ...completeProfiles,
          ...complementaryMocks,
        ]);
      } else {
        setCompanions(
          MOCK_COMPANIONS.map((m) => ({
            ...m,
            is_busy: Boolean(m.is_busy || busyMap.has(m.id)),
            active_booking_status: busyMap.get(m.id) || m.active_booking_status || null,
          }))
        );
      }
    } catch (err) {
      console.warn("Fetch companions caught error:", err);
      setCompanions(
        MOCK_COMPANIONS.map((m) => ({
          ...m,
          is_busy: Boolean(m.is_busy || busyMap.has(m.id)),
          active_booking_status: busyMap.get(m.id) || m.active_booking_status || null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadInitial();

    // Listen for realtime booking or profile updates to refresh availability
    const channelId = `companions-list-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadInitial();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companion_profiles' },
        () => {
          loadInitial();
        }
      )
      .subscribe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? { id: session.user.id } : null);
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [loadInitial, supabase]);

  // Build target booking URL with pre-filled query params
  const getBookingUrl = (companionId: string) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchArea) params.set("area", searchArea);
    if (specialNeedFilter) params.set("need", specialNeedFilter);
    if (appointmentDate) params.set("date", appointmentDate);
    if (startTime) params.set("time", startTime);
    const queryString = params.toString();
    return `/customer/book/${companionId}${queryString ? `?${queryString}` : ""}`;
  };

  // Handle Companion Selection
  const handleSelectCompanion = async (companion: CompanionCardData) => {
    // If the companion selected is the user themselves, route to profile edit
    if (currentUser && companion.id === currentUser.id) {
      router.push("/companion/profile");
      return;
    }

    // If the companion is busy, block booking selection with friendly alert
    if (companion.is_busy) {
      Swal.fire({
        title: 'ผู้ช่วยติดภารกิจในขณะนี้',
        html: `
          <div class="text-left space-y-2 text-sm text-gray-700">
            <p class="font-bold text-amber-800">⚠️ ขณะนี้ผู้ช่วยกำลังติดภารกิจดูแลลูกค้าท่านอื่นอยู่</p>
            <p>ระบบไม่อนุญาตให้เลือกหรือจองผู้ช่วยท่านนี้ในระหว่างที่กำลังให้บริการลูกค้าท่านอื่นอยู่ครับ</p>
            <div class="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
              เมื่อผู้ช่วยเสร็จสิ้นภารกิจกับลูกค้าท่านก่อนหน้าแล้ว สถานะจะกลับมาเป็น <strong>&ldquo;ว่าง&rdquo;</strong> และเปิดให้จองได้ตามปกติทันทีครับ
            </div>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#059669',
        confirmButtonText: 'เข้าใจแล้ว',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
      return;
    }

    // Save pending requirements to sessionStorage for extra reliability
    if (typeof window !== "undefined") {
      let existingData: Record<string, unknown> = {};
      try {
        const stored = sessionStorage.getItem("pending_booking_requirements");
        if (stored) existingData = JSON.parse(stored);
      } catch {}

      sessionStorage.setItem(
        "pending_booking_requirements",
        JSON.stringify({
          ...existingData,
          companionId: companion.id,
          category: selectedCategory || (existingData.category as string) || "",
          area: searchArea || (existingData.area as string) || "",
          need: specialNeedFilter || (existingData.need as string) || "",
          appointmentDate: appointmentDate || (existingData.appointmentDate as string) || "",
          startTime: startTime || (existingData.startTime as string) || "",
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
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {isAdmin ? 'ดูผู้ช่วย' : 'ค้นหาผู้ช่วย'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              รายชื่อผู้ช่วยทั้งหมดที่พร้อมให้บริการ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="ค้นหาชื่อผู้ช่วย..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shrink-0">
              พบ {filteredCompanions.length} ท่าน
            </span>
          </div>
        </div>

        {/* Errand Category Selection Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                เลือกตามประเภทธุระ (Errand Categories):
              </h2>
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="text-xs text-emerald-700 font-bold hover:underline self-start sm:self-auto cursor-pointer"
              >
                ล้างตัวกรองหมวดหมู่ธุระ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
            {/* All Categories Button */}
            <button
              type="button"
              onClick={() => handleCategorySelect()}
              className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer active:scale-95 ${
                isAllCategoriesActive
                  ? "bg-gray-950 text-white border-gray-950 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <span className="text-sm">🌟</span>
              <span>ทุกประเภทธุระ</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isAllCategoriesActive
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filteredCompanions.length}
              </span>
            </button>

            {/* Individual Errand Categories */}
            {ERRAND_CATEGORIES.map((cat) => {
              const active = isCategoryActive(cat.id);
              const count = getCategoryCount(cat.id);
              const iconEmoji = getCategoryEmoji(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer active:scale-95 ${
                    active
                      ? `${cat.color.activeBg} border-transparent`
                      : `bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-slate-50`
                  }`}
                >
                  <span className="text-sm">{iconEmoji}</span>
                  <span>{cat.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      active
                        ? "bg-white/25 text-white"
                        : `${cat.color.bgLight} ${cat.color.badgeText} border ${cat.color.border}`
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability Filter & View Mode Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 pb-1">
          {/* Availability Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 mr-1">สถานะ:</span>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                availabilityFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>ทั้งหมด</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  availabilityFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {companions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                availabilityFilter === 'available'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ว่างตอนนี้</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  availabilityFilter === 'available' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {companions.filter((c) => !c.is_busy && !c.is_suspended && c.is_available).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAvailabilityFilter('busy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                availabilityFilter === 'busy'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>ติดภารกิจ (ไม่ว่าง)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  availabilityFilter === 'busy' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {companions.filter((c) => Boolean(c.is_busy)).length}
              </span>
            </button>
          </div>

          {/* View Mode Switcher (Grouped vs Flat) */}
          {isAllCategoriesActive && (
            <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "grouped"
                    ? "bg-white text-emerald-900 shadow-xs border border-gray-200/60"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>แบ่งกลุ่มตามประเภทธุระ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-emerald-900 shadow-xs border border-gray-200/60"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                <span>แสดงรวมทั้งหมด</span>
              </button>
            </div>
          )}
        </div>

        {/* Alternative Companion Banner (when filtered from rejected booking) */}
        {excludeId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <strong className="block text-sm sm:text-base font-extrabold text-amber-950">
                  กำลังแนะนำผู้ช่วยท่านอื่นที่ว่างและพร้อมให้บริการแทน
                </strong>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  {appointmentDate ? `สำหรับวันที่ ${formatThaiDate(appointmentDate)}` : ''}
                  {startTime ? ` เวลา ${startTime.slice(0, 5)} น.` : ''}
                  {' '}(ระบบได้คัดกรองผู้ช่วยที่ปฏิเสธงานออกเรียบร้อยแล้ว)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setExcludeId('');
                setAppointmentDate('');
                setStartTime('');
              }}
              className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition shrink-0 cursor-pointer shadow-2xs active:scale-95"
            >
              แสดงผู้ช่วยทุกคน
            </button>
          </div>
        )}

        {/* Active Category Banner */}
        {activeCategoryDef && (
          <div
            className={`p-4 sm:p-5 rounded-3xl border ${activeCategoryDef.color.bgLight} ${activeCategoryDef.color.border} shadow-2xs`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border bg-white ${activeCategoryDef.color.accent} ${activeCategoryDef.color.border} shadow-2xs text-xl sm:text-2xl`}
                >
                  {getCategoryEmoji(activeCategoryDef.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                      ประเภทธุระ:
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-gray-950">
                      {activeCategoryDef.name}
                    </h2>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border ${activeCategoryDef.color.badgeBg}`}
                    >
                      {activeCategoryDef.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {activeCategoryDef.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-95 self-end sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>แสดงทุกประเภทธุระ</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 bg-white rounded-3xl animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : isAllCategoriesActive && viewMode === "grouped" ? (
          /* GROUPED BY ERRAND CATEGORY */
          <div className="space-y-8">
            {ERRAND_CATEGORIES.map((cat) => {
              const catCompanions = filteredCompanions.filter((comp) =>
                getCompanionCategories(comp).some((c) => c.id === cat.id)
              );

              return (
                <div
                  key={cat.id}
                  id={`category-${cat.slug}`}
                  className="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-gray-200/80 shadow-xs space-y-4 sm:space-y-5"
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border ${cat.color.bgLight} ${cat.color.accent} ${cat.color.border} text-xl sm:text-2xl shadow-2xs`}
                      >
                        {getCategoryEmoji(cat.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 tracking-tight">
                            {cat.name}
                          </h2>
                          <span
                            className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${cat.color.badgeBg}`}
                          >
                            {cat.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                        พบ {catCompanions.length} ท่าน
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(String(cat.id))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer hover:shadow-xs active:scale-95 ${cat.color.bgLight} ${cat.color.badgeText} ${cat.color.border}`}
                      >
                        ดูเฉพาะหมวดนี้ →
                      </button>
                    </div>
                  </div>

                  {/* Companion Cards in this Category */}
                  {catCompanions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {catCompanions.map((comp) => (
                        <CompanionCard
                          key={`${cat.id}-${comp.id}`}
                          companion={comp}
                          currentUser={currentUser}
                          isAdmin={isAdmin}
                          onSelect={handleSelectCompanion}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 sm:py-8 px-4 text-center rounded-2xl bg-gray-50/70 border border-dashed border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        ไม่พบผู้ช่วยที่ตรงกับเงื่อนไขการค้นหาในหมวดนี้ขณะนี้
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : filteredCompanions.length > 0 ? (
          /* FLAT GRID VIEW (Single Category or ViewMode Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanions.map((comp) => (
              <CompanionCard
                key={comp.id}
                companion={comp}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onSelect={handleSelectCompanion}
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
            <p className="text-gray-500 text-base">
              ไม่พบรายชื่อผู้ช่วยที่ค้นหาในขณะนี้
            </p>
            {(searchKeyword || selectedCategory || availabilityFilter !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold hover:bg-emerald-200 transition cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginModal && selectedCompanionForBooking && (
        <LoginRequiredModal
          companion={selectedCompanionForBooking}
          onClose={() => setShowLoginModal(false)}
          onGoogleLogin={handleModalGoogleLogin}
        />
      )}
    </section>
  );
}
