import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";
import { SERVICE_CATEGORIES } from "./constants";
import { parseVehicleDetails, ParsedVehicleInfo, cleanErrandDetails } from "@/lib/vehicleUtils";
import { MOCK_COMPANIONS } from "@/components/companions/search/constants";
import { CompanionProfile } from "@/types/database";
import {
  getCompanionLocation,
  calculateBookingPricing,
  CompanionLocation,
  BookingPricingResult,
} from "@/lib/distancePricing";

export interface CompanionVehicleInfo {
  type: string;
  model?: string | null;
}

export interface BookingFormErrors {
  errandTitle?: boolean;
  originAddress?: boolean;
  destinationAddress?: boolean;
  selectedVehicle?: boolean;
  appointmentDate?: boolean;
  startTime?: boolean;
}

export function useBookingForm(companionId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [activeHourlyRate, setActiveHourlyRate] = useState(250);
  const [companionName, setCompanionName] = useState("ผู้ช่วยร่วมเดินทาง");
  const [companionAvatar, setCompanionAvatar] = useState<string | null>(null);
  const [companionLocation, setCompanionLocation] =
    useState<CompanionLocation | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Validation error states
  const [fieldErrors, setFieldErrors] = useState<BookingFormErrors>({});

  const clearFieldError = (field: keyof BookingFormErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Vehicle states
  const [vehicleDetails, setVehicleDetails] =
    useState<ParsedVehicleInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<
    "car" | "motorcycle" | "none" | null
  >(null);

  // Form states
  const [categoryId, setCategoryId] = useState(1);
  const [customCategory, setCustomCategory] = useState("");
  const [errandTitle, setErrandTitle] = useState("");
  const [errandDetails, setErrandDetails] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [companionVehicle, setCompanionVehicle] =
    useState<CompanionVehicleInfo | null>(null);

  // Calculate pricing based on vehicle fee + distance fee from companion location
  const pricing: BookingPricingResult = useMemo(() => {
    const compLoc = companionLocation || {
      lat: 13.7563,
      lng: 100.5018,
      name: "กรุงเทพมหานคร",
    };

    return calculateBookingPricing({
      selectedVehicle,
      vehicleRates: {
        carRate: vehicleDetails?.car?.rate || 0,
        motorcycleRate: vehicleDetails?.motorcycle?.rate || 0,
        baseRate: vehicleDetails?.baseRate || 0,
      },
      companionLoc: compLoc,
      originAddress,
      originLat,
      originLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      isMeetAtDestination: selectedVehicle === "none",
    });
  }, [
    selectedVehicle,
    vehicleDetails,
    companionLocation,
    originAddress,
    originLat,
    originLng,
    destinationAddress,
    destinationLat,
    destinationLng,
  ]);

  const totalPrice = pricing.totalPrice;
  const vehicleBaseFee = pricing.vehicleBaseFee;
  const distanceFee = pricing.distanceFee;
  const totalDistanceKm = pricing.totalDistanceKm;
  const leg1Km = pricing.leg1Km;
  const leg2Km = pricing.leg2Km;
  const hasCalculatedDistance = pricing.hasCalculatedDistance;

  const handleSelectVehicle = (v: "car" | "motorcycle" | "none") => {
    setSelectedVehicle(v);
    clearFieldError("selectedVehicle");
    if (v === "none") {
      clearFieldError("originAddress");
    }
    if (vehicleDetails) {
      let newRate = vehicleDetails.baseRate;
      if (v === "car" && vehicleDetails.hasCar) {
        newRate = vehicleDetails.car.rate;
      } else if (v === "motorcycle" && vehicleDetails.hasMotorcycle) {
        newRate = vehicleDetails.motorcycle.rate;
      }
      setActiveHourlyRate(newRate);
    }
  };

  const handleTitleChange = (val: string) => {
    setErrandTitle(val);
    if (val.trim()) clearFieldError("errandTitle");
  };

  const handleOriginAddressChange = (val: string) => {
    setOriginAddress(val);
    if (val.trim()) clearFieldError("originAddress");
  };

  const handleDestinationAddressChange = (val: string) => {
    setDestinationAddress(val);
    if (val.trim()) clearFieldError("destinationAddress");
  };

  const handleAppointmentDateChange = (val: string) => {
    setAppointmentDate(val);
    if (val.trim()) clearFieldError("appointmentDate");
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val.trim()) clearFieldError("startTime");
  };

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
          *,
          profile:profiles(full_name, avatar_url)
        `,
        )
        .eq("id", companionId)
        .single();

      type BookingCompanionData = Partial<CompanionProfile> & {
        profile?: { full_name?: string | null; avatar_url?: string | null } | null;
      };

      let compData: BookingCompanionData | null = comp as BookingCompanionData | null;
      if (!compData) {
        const mock = MOCK_COMPANIONS.find((c) => c.id === companionId);
        if (mock) {
          compData = mock;
        }
      }

      if (compData) {
        if (
          compData.verification_status !== 'verified' ||
          !compData.hourly_rate ||
          Number(compData.hourly_rate) <= 0
        ) {
          setErrorMsg(
            'ผู้ช่วยท่านนี้ยังอยู่ระหว่างการตรวจสอบหรือยังกรอกข้อมูลไม่ครบถ้วน จึงยังไม่สามารถเปิดรับการจองได้'
          );
        }

        const parsed = parseVehicleDetails(
          compData.vehicle_type,
          compData.vehicle_model,
          compData.vehicle_plate,
          compData.hourly_rate,
          compData.bio
        );
        setVehicleDetails(parsed);

        // Resolve companion location for distance calculation
        const resolvedLoc = getCompanionLocation(compData);
        setCompanionLocation(resolvedLoc);

        // Keep vehicle unselected initially so total price starts at ฿0
        setSelectedVehicle(null);
        setActiveHourlyRate(parsed.baseRate);

        setCompanionVehicle({
          type: parsed.type,
          model:
            parsed.type === "car"
              ? parsed.car.model
              : parsed.type === "motorcycle"
                ? parsed.motorcycle.model
                : parsed.type === "both"
                  ? `${parsed.car.model || 'รถยนต์'} / ${parsed.motorcycle.model || 'มอเตอร์ไซค์'}`
                  : null,
        });
        const profileData = compData.profile as { full_name?: string; avatar_url?: string } | null;
        if (profileData?.full_name) {
          setCompanionName(profileData.full_name);
        }

        const isGoogleAvatar = (url?: string | null) =>
          Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));
        const avatar =
          profileData?.avatar_url && !isGoogleAvatar(profileData.avatar_url)
            ? profileData.avatar_url
            : compData.id_card_image_url || profileData?.avatar_url || null;
        if (avatar) {
          setCompanionAvatar(avatar);
        }
      }

      // 3. Handle Pre-filling from Search Params or sessionStorage
      let categoryParam = searchParams.get("category");
      let areaParam = searchParams.get("area");
      let needParam = searchParams.get("need");

      let rebookPayload: any = null;
      if (typeof window !== "undefined") {
        try {
          const saved = sessionStorage.getItem("pending_booking_requirements");
          if (saved) {
            const parsed = JSON.parse(saved);
            rebookPayload = parsed;
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

      // Pre-fill rich rebooking data if coming from a rejected job
      if (rebookPayload) {
        if (rebookPayload.errandTitle) {
          setErrandTitle(rebookPayload.errandTitle);
          hadPrefill = true;
        }
        if (rebookPayload.errandDetails) {
          setErrandDetails(cleanErrandDetails(rebookPayload.errandDetails));
          hadPrefill = true;
        }
        if (rebookPayload.originAddress) {
          setOriginAddress(rebookPayload.originAddress);
          if (rebookPayload.originLat) setOriginLat(rebookPayload.originLat);
          if (rebookPayload.originLng) setOriginLng(rebookPayload.originLng);
          hadPrefill = true;
        }
        if (rebookPayload.destinationAddress) {
          setDestinationAddress(rebookPayload.destinationAddress);
          if (rebookPayload.destinationLat) setDestinationLat(rebookPayload.destinationLat);
          if (rebookPayload.destinationLng) setDestinationLng(rebookPayload.destinationLng);
          hadPrefill = true;
        }
        if (rebookPayload.appointmentDate) {
          setAppointmentDate(rebookPayload.appointmentDate);
          hadPrefill = true;
        }
        if (rebookPayload.startTime) {
          setStartTime(rebookPayload.startTime.slice(0, 5));
          hadPrefill = true;
        }
        if (rebookPayload.specialNeeds) {
          setSpecialNeeds(rebookPayload.specialNeeds);
          hadPrefill = true;
        }
      }

      // Check URL date and time params as fallback
      const dateParam = searchParams.get("date");
      const timeParam = searchParams.get("time");
      if (dateParam) {
        setAppointmentDate(dateParam);
        hadPrefill = true;
      }
      if (timeParam) {
        setStartTime(timeParam.slice(0, 5));
        hadPrefill = true;
      }

      setIsPrefilled(hadPrefill);

      // Default date to tomorrow only if not set from rebookPayload or URL
      if (!rebookPayload?.appointmentDate && !dateParam) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setAppointmentDate(tomorrow.toISOString().split("T")[0]);
      }

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
          categoryId,
          category:
            categoryId === 99
              ? customCategory
              : SERVICE_CATEGORIES.find((c) => c.id === categoryId)?.name || "",
          errandTitle,
          errandDetails: cleanErrandDetails(errandDetails),
          originAddress,
          originLat,
          originLng,
          destinationAddress,
          destinationLat,
          destinationLng,
          appointmentDate,
          startTime,
          specialNeeds,
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
        queryParams: {
          prompt: "select_account",
        },
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

    const isMeetAtDestination = selectedVehicle === 'none';
    const errors: BookingFormErrors = {};
    let firstInvalidId: string | null = null;
    let firstErrorMsg = "";

    // 1. หัวข้อธุระ (Section 2)
    if (!errandTitle.trim()) {
      errors.errandTitle = true;
      if (!firstInvalidId) {
        firstInvalidId = "errand-title-input";
        firstErrorMsg = "กรุณาระบุหัวข้อธุระ";
      }
    }

    // 2. จุดรับผู้เดินทาง (Section 3 - ถ้าไม่ใช่พบกันที่จุดหมาย)
    if (!isMeetAtDestination && !originAddress.trim()) {
      errors.originAddress = true;
      if (!firstInvalidId) {
        firstInvalidId = "origin-address-input";
        firstErrorMsg = "กรุณาระบุจุดรับผู้เดินทาง หรือเลือกพบกันที่จุดหมาย";
      }
    }

    // 3. จุดหมายปลายทาง (Section 3)
    if (!destinationAddress.trim()) {
      errors.destinationAddress = true;
      if (!firstInvalidId) {
        firstInvalidId = "destination-address-input";
        firstErrorMsg = "กรุณาระบุจุดหมายปลายทาง";
      }
    }

    // 4. ยานพาหนะ (Section 4)
    if (!selectedVehicle) {
      errors.selectedVehicle = true;
      if (!firstInvalidId) {
        firstInvalidId = "section-vehicle";
        firstErrorMsg = "กรุณาเลือกรูปแบบยานพาหนะในการร่วมเดินทาง (รถยนต์, มอเตอร์ไซค์ หรือพบกันที่จุดหมาย)";
      }
    }

    // 5. วันที่นัดหมาย (Section 5)
    if (!appointmentDate.trim()) {
      errors.appointmentDate = true;
      if (!firstInvalidId) {
        firstInvalidId = "appointment-date-input";
        firstErrorMsg = "กรุณาระบุวันที่นัดหมาย";
      }
    }

    // 6. เวลาเริ่มนัดหมาย (Section 5)
    if (!startTime.trim()) {
      errors.startTime = true;
      if (!firstInvalidId) {
        firstInvalidId = "start-time-input";
        firstErrorMsg = "กรุณาระบุเวลาเริ่มนัดหมาย";
      }
    }

    if (firstInvalidId) {
      setFieldErrors(errors);
      setErrorMsg(firstErrorMsg);

      setTimeout(() => {
        const el = document.getElementById(firstInvalidId!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "BUTTON"
          ) {
            (el as HTMLElement).focus({ preventScroll: true });
          } else {
            const focusable = el.querySelector<HTMLElement>("button, input, [tabindex='0']");
            if (focusable) focusable.focus({ preventScroll: true });
          }
        }
      }, 80);

      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      let vehicleNote = "";
      if (selectedVehicle === "car" && vehicleDetails?.hasCar) {
        vehicleNote = `[ยานพาหนะที่เลือก: 🚗 รถยนต์ส่วนตัว (${vehicleDetails.car.model || "มีรถยนต์ส่วนตัว"}) - ค่ารถ ฿${vehicleBaseFee}]`;
      } else if (
        selectedVehicle === "motorcycle" &&
        vehicleDetails?.hasMotorcycle
      ) {
        vehicleNote = `[ยานพาหนะที่เลือก: 🛵 รถมอเตอร์ไซค์ (${vehicleDetails.motorcycle.model || "มีมอเตอร์ไซค์"}) - ค่ารถ ฿${vehicleBaseFee}]`;
      } else {
        vehicleNote = `[ยานพาหนะที่เลือก: 🚶 พบกันที่จุดหมายปลายทาง]`;
      }

      const distanceSummaryNote = hasCalculatedDistance
        ? `[ระยะทางรวม: ${totalDistanceKm} กม. (ค่าระยะทาง ฿${distanceFee} จากจุดเริ่มต้นผู้ช่วย: ${companionLocation?.name || "พิกัดผู้ช่วย"})]`
        : "";

      const cleanCustomerNotes = cleanErrandDetails(errandDetails);

      const combinedDetails = [
        customCategory ? `[ประเภทธุระระบุเอง: ${customCategory}]` : "",
        vehicleNote,
        distanceSummaryNote,
        cleanCustomerNotes,
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      // Create Booking in Supabase
      const { error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        companion_id: companionId,
        category_id: categoryId === 99 ? 5 : categoryId,
        errand_title: errandTitle,
        errand_details: combinedDetails,
        origin_address: isMeetAtDestination
          ? (originAddress.trim() || `พบกันที่จุดหมาย: ${destinationAddress.trim()}`)
          : originAddress.trim(),
        origin_lat: isMeetAtDestination ? (originLat || destinationLat) : originLat,
        origin_lng: isMeetAtDestination ? (originLng || destinationLng) : originLng,
        destination_address: destinationAddress.trim(),
        destination_lat: destinationLat,
        destination_lng: destinationLng,
        appointment_date: appointmentDate,
        start_time: startTime,
        duration_hours: 1,
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
      console.error('Booking submission error:', err);
      const postgrestErr = err as { message?: string; details?: string; hint?: string };
      const rawMsg = postgrestErr?.message || (err instanceof Error ? err.message : '');
      let displayError = rawMsg || "เกิดข้อผิดพลาดในการสร้างคำขอ";

      if (rawMsg.includes("bookings_companion_id_fkey") || rawMsg.includes("Key (companion_id)")) {
        displayError = "ไม่พบข้อมูลผู้ช่วยในฐานข้อมูล (หากเป็นผู้ช่วยตัวอย่าง กรุณารันคำสั่ง SQL Seed ใน Supabase SQL Editor)";
      } else if (rawMsg.includes("bookings_category_id_fkey") || rawMsg.includes("Key (category_id)")) {
        displayError = "ไม่พบหมวดหมู่บริการในฐานข้อมูล (กรุณาเพิ่มข้อมูลในตาราง service_categories ใน Supabase)";
      } else if (rawMsg.includes("row-level security") || rawMsg.includes("policy")) {
        displayError = "ไม่มีสิทธิ์บันทึกคำขอจอง (กรุณาเปิด RLS Policy สำหรับ INSERT ของตาราง bookings ใน Supabase)";
      }

      setErrorMsg(displayError);
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    user,
    companionName,
    companionAvatar,
    companionRate: activeHourlyRate,
    activeHourlyRate,
    companionVehicle,
    vehicleDetails,
    selectedVehicle,
    handleSelectVehicle,
    isPrefilled,
    totalPrice,
    vehicleBaseFee,
    distanceFee,
    totalDistanceKm,
    leg1Km,
    leg2Km,
    hasCalculatedDistance,
    companionLocation,
    companionLocationName: companionLocation?.name || "",
    fieldErrors,
    clearFieldError,
    categoryId,
    customCategory,
    errandTitle,
    setErrandTitle: handleTitleChange,
    errandDetails,
    setErrandDetails,
    originAddress,
    setOriginAddress: handleOriginAddressChange,
    originLat,
    setOriginLat,
    originLng,
    setOriginLng,
    destinationAddress,
    setDestinationAddress: handleDestinationAddressChange,
    destinationLat,
    setDestinationLat,
    destinationLng,
    setDestinationLng,
    appointmentDate,
    setAppointmentDate: handleAppointmentDateChange,
    startTime,
    setStartTime: handleStartTimeChange,
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
