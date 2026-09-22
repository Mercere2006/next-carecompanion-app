"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanionCard from "@/components/companions/CompanionCard";
import { CompanionCardData } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useCompanionFilter } from "./search/useCompanionFilter";
import SearchFilterBox from "./search/SearchFilterBox";
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
      // 1. Check user auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user ? { id: user.id } : null);

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
          .eq("is_available", true)
          .gt("hourly_rate", 0);

        if (error) {
          console.warn("Companion profiles query notice:", error.message);
        }

        if (!error && data && data.length > 0) {
          // กรองเฉพาะ Companion ที่กรอกข้อมูลครบถ้วนจริง ๆ (มีชื่อ, เรทราคา > 0, มี bio)
          const completeProfiles = (data as unknown as CompanionCardData[]).filter(
            (c) => {
              const hasName = Boolean(
                c.profile?.full_name && c.profile.full_name.trim().length > 0,
              );
              const hasRate = Number(c.hourly_rate) > 0;
              const hasBio = Boolean(c.bio && c.bio.trim().length > 0);
              const isAvail = c.is_available === true;
              return isAvail && hasRate && hasBio && hasName;
            },
          );

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
        <SearchFilterBox
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchArea={searchArea}
          onAreaChange={setSearchArea}
          specialNeedFilter={specialNeedFilter}
          onSpecialNeedChange={setSpecialNeedFilter}
          maxRate={maxRate}
          onMaxRateChange={setMaxRate}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          resultsCount={filteredCompanions.length}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />

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
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold hover:bg-emerald-200 transition cursor-pointer"
            >
              ล้างเงื่อนไขทั้งหมด
            </button>
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
