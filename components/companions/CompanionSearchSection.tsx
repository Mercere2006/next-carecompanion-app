"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import CompanionCard from "@/components/companions/CompanionCard";
import { CompanionCardData } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth gate modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCompanionForBooking, setSelectedCompanionForBooking] =
    useState<CompanionCardData | null>(null);

  // Hook for filtering & search states (exclude current user so "companion คนอื่น ๆ" are shown)
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
    filteredCompanions,
    hasActiveFilters,
    resetFilters,
  } = useCompanionFilter(companions);

  useEffect(() => {
    async function loadInitial() {
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

      // 2. Fetch companions from DB and merge with fallback companions
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
          // Enrich hourly_rate from vehicle or bio if DB column has 0
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
            return {
              ...c,
              hourly_rate: rate > 0 ? rate : c.hourly_rate,
            };
          });

          // กรองเฉพาะ Companion ที่กรอกข้อมูลครบถ้วนจริง ๆ (มีชื่อ, เรทราคา > 0, มี bio, เปิดรับงาน และไม่ถูกระงับ)
          const completeProfiles = enriched.filter((c) => {
            const hasName = Boolean(
              c.profile?.full_name && c.profile.full_name.trim().length > 0,
            );
            const hasRate = Number(c.hourly_rate) > 0;
            const hasBio = Boolean(c.bio && c.bio.trim().length > 0);
            const isAvail = c.is_available === true;
            const notSuspended = !c.is_suspended;
            return isAvail && notSuspended && hasRate && hasBio && hasName;
          });

          const realIds = new Set(completeProfiles.map((c) => c.id));
          const complementaryMocks = MOCK_COMPANIONS.filter(
            (m) => !realIds.has(m.id),
          );
          setCompanions([
            ...completeProfiles,
            ...complementaryMocks,
          ]);
        } else {
          setCompanions(MOCK_COMPANIONS);
        }
      } catch (err) {
        console.warn("Fetch companions caught error:", err);
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
    // If the companion selected is the user themselves, route to profile edit
    if (currentUser && companion.id === currentUser.id) {
      router.push("/companion/profile");
      return;
    }

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
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
            <p className="text-gray-500 text-base">
              ไม่พบรายชื่อผู้ช่วยที่ค้นหาในขณะนี้
            </p>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold hover:bg-emerald-200 transition cursor-pointer"
              >
                ล้างคำค้นหา
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
