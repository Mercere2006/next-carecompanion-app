import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";
import { SERVICE_CATEGORIES } from "./constants";

export interface CompanionVehicleInfo {
  type: string;
  model?: string | null;
}

export function useBookingForm(companionId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [companionRate, setCompanionRate] = useState(250);
  const [companionName, setCompanionName] = useState("ผู้ช่วยร่วมเดินทาง");
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Form states
  const [categoryId, setCategoryId] = useState(1);
  const [customCategory, setCustomCategory] = useState("");
  const [errandTitle, setErrandTitle] = useState("");
  const [errandDetails, setErrandDetails] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(13.7563);
  const [originLng, setOriginLng] = useState<number | null>(100.5018);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLat, setDestinationLat] = useState<number | null>(13.7578);
  const [destinationLng, setDestinationLng] = useState<number | null>(100.4855);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState(3);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [companionVehicle, setCompanionVehicle] =
    useState<CompanionVehicleInfo | null>(null);

  // Calculate total price
  const totalPrice = durationHours * companionRate;

  useEffect(() => {
    async function loadData() {
      // 1. Check user auth
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser ? { id: currentUser.id } : null);

      // 2. Load companion info
      const { data: comp } = await supabase
        .from("companion_profiles")
        .select(
          `
          hourly_rate,
          vehicle_type,
          vehicle_model,
          profile:profiles(full_name)
        `,
        )
        .eq("id", companionId)
        .single();

      if (comp) {
        setCompanionRate(Number(comp.hourly_rate) || 250);
        if (comp.vehicle_type) {
          setCompanionVehicle({
            type: comp.vehicle_type,
            model: comp.vehicle_model,
          });
        }
        const profileData = comp.profile as { full_name?: string } | null;
        if (profileData?.full_name) {
          setCompanionName(profileData.full_name);
        }
      }

      // 3. Handle Pre-filling from Search Params or sessionStorage
      let categoryParam = searchParams.get("category");
      let areaParam = searchParams.get("area");
      let needParam = searchParams.get("need");

      if (typeof window !== "undefined") {
        try {
          const saved = sessionStorage.getItem("pending_booking_requirements");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (!categoryParam && parsed.category)
              categoryParam = parsed.category;
            if (!areaParam && parsed.area) areaParam = parsed.area;
            if (!needParam && parsed.need) needParam = parsed.need;
          }
        } catch (e) {
          console.error("Failed to parse sessionStorage requirements", e);
        }
      }

      let hadPrefill = false;

      if (categoryParam) {
        hadPrefill = true;
        const matched = SERVICE_CATEGORIES.find(
          (c) =>
            c.name.toLowerCase() === categoryParam?.toLowerCase() ||
            categoryParam?.includes(c.name) ||
            c.name.includes(categoryParam!),
        );
        if (matched) {
          setCategoryId(matched.id);
          setCustomCategory("");
          setErrandTitle(
            `${matched.name}${areaParam ? ` (เขต${areaParam})` : ""}`,
          );
        } else {
          // Custom errand type specified
          setCategoryId(99);
          setCustomCategory(categoryParam);
          setErrandTitle(
            `${categoryParam}${areaParam ? ` (เขต${areaParam})` : ""}`,
          );
        }
      }

      if (areaParam) {
        hadPrefill = true;
        setOriginAddress(areaParam);
      }

      if (needParam) {
        hadPrefill = true;
        setSpecialNeeds(needParam);
      }

      setIsPrefilled(hadPrefill);

      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentDate(tomorrow.toISOString().split("T")[0]);

      setLoading(false);
    }

    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [companionId, searchParams, supabase]);

  const handleGoogleLogin = async () => {
    // Save current form state to sessionStorage so nothing is lost upon redirect
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "pending_booking_requirements",
        JSON.stringify({
          companionId,
          category:
            categoryId === 99
              ? customCategory
              : SERVICE_CATEGORIES.find((c) => c.id === categoryId)?.name || "",
          area: originAddress,
          need: specialNeeds,
        }),
      );
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`,
      },
    });
  };

  const handleCategorySelect = (id: number, catName?: string) => {
    setCategoryId(id);
    if (id !== 99) {
      setCustomCategory("");
      if (
        catName &&
        (!errandTitle ||
          errandTitle.startsWith("พบแพทย์") ||
          errandTitle.startsWith("ติดต่อ") ||
          errandTitle.startsWith("ซื้อ") ||
          errandTitle.startsWith("ธุระ"))
      ) {
        setErrandTitle(
          `${catName}${originAddress ? ` (${originAddress})` : ""}`,
        );
      }
    } else {
      if (customCategory) {
        setErrandTitle(
          `${customCategory}${originAddress ? ` (${originAddress})` : ""}`,
        );
      }
    }
  };

  const handleCustomCategoryChange = (text: string) => {
    setCustomCategory(text);
    setErrandTitle(`${text}${originAddress ? ` (${originAddress})` : ""}`);
  };

  const handleQuickNeedTag = (tag: string) => {
    if (!specialNeeds) {
      setSpecialNeeds(tag);
    } else if (!specialNeeds.includes(tag)) {
      setSpecialNeeds(`${specialNeeds}, ${tag}`);
    }
  };

  const handleClearNeeds = () => {
    setSpecialNeeds("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await Swal.fire({
        title: "กรุณาเข้าสู่ระบบก่อนจอง",
        text: "ระบบจะนำคุณไปเข้าสู่ระบบด้วย Google และจะพาคุณกลับมาส่งคำขอนี้ต่อทันที",
        icon: "info",
        confirmButtonColor: "#059669",
        confirmButtonText: "เข้าสู่ระบบด้วย Google",
        showCancelButton: true,
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "rounded-3xl shadow-2xl font-sans",
          confirmButton: "rounded-xl px-6 py-2.5 font-bold",
          cancelButton: "rounded-xl px-5 py-2.5 font-bold",
        },
      }).then((res) => {
        if (res.isConfirmed) {
          handleGoogleLogin();
        }
      });
      return;
    }

    if (
      !errandTitle.trim() ||
      !originAddress.trim() ||
      !destinationAddress.trim()
    ) {
      setErrorMsg("กรุณากรอกข้อมูลธุระและสถานที่ให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Create Booking in Supabase
      const { error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        companion_id: companionId,
        category_id: categoryId === 99 ? 5 : categoryId,
        errand_title: errandTitle,
        errand_details: customCategory
          ? `[ประเภทธุระระบุเอง: ${customCategory}] ${errandDetails}`.trim()
          : errandDetails,
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
        status: "pending",
      });

      if (error) throw error;

      // Clear pending storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_booking_requirements");
      }

      await Swal.fire({
        title: "สร้างคำขอสำเร็จ!",
        text: "สร้างคำขอจองบริการเรียบร้อยแล้ว กำลังนำคุณไปยังหน้าติดตามสถานะ",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-3xl shadow-2xl font-sans",
        },
      });

      router.push("/customer/dashboard");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างคำขอ",
      );
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    user,
    companionName,
    companionRate,
    companionVehicle,
    isPrefilled,
    totalPrice,
    categoryId,
    customCategory,
    errandTitle,
    setErrandTitle,
    errandDetails,
    setErrandDetails,
    originAddress,
    setOriginAddress,
    originLat,
    setOriginLat,
    originLng,
    setOriginLng,
    destinationAddress,
    setDestinationAddress,
    destinationLat,
    setDestinationLat,
    destinationLng,
    setDestinationLng,
    appointmentDate,
    setAppointmentDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    specialNeeds,
    setSpecialNeeds,
    errorMsg,
    handleGoogleLogin,
    handleCategorySelect,
    handleCustomCategoryChange,
    handleQuickNeedTag,
    handleClearNeeds,
    handleSubmit,
  };
}
