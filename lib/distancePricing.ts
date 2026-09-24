/**
 * Distance Calculation and Tiered Pricing Utilities for CareCompanion
 * Based on companion location, customer pickup/destination, and rate tiers:
 * - 0–2 กม. แรก: 45 บาท
 * - กม. ที่ 2–6: 8 บาท/กม.
 * - กม. ที่ 6–40: 7 บาท/กม.
 * - กม. ที่ 40 ขึ้นไป: 10 บาท/กม.
 */

export interface CompanionLocation {
  lat: number;
  lng: number;
  name: string;
}

// Known Bangkok district coordinate dictionary for automatic mapping
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  บางกอกน้อย: { lat: 13.7557, lng: 100.4853, name: "เขตบางกอกน้อย (ใกล้ รพ.ศิริราช)" },
  ศิริราช: { lat: 13.7589, lng: 100.4858, name: "ศิริราช (บางกอกน้อย)" },
  ปทุมวัน: { lat: 13.7462, lng: 100.5347, name: "เขตปทุมวัน (สยาม - จุฬาฯ)" },
  สยาม: { lat: 13.7462, lng: 100.5347, name: "สยาม (ปทุมวัน)" },
  พญาไท: { lat: 13.7651, lng: 100.5376, name: "เขตพญาไท (อนุสาวรีย์ชัยฯ)" },
  ราชวิถี: { lat: 13.7651, lng: 100.5376, name: "ราชวิถี (พญาไท)" },
  จตุจักร: { lat: 13.8036, lng: 100.5538, name: "เขตจตุจักร (เซ็นทรัลลาดพร้าว)" },
  ลาดพร้าว: { lat: 13.8036, lng: 100.5538, name: "เขตลาดพร้าว" },
  สีลม: { lat: 13.7234, lng: 100.5284, name: "สีลม (บางรัก)" },
  สาทร: { lat: 13.7200, lng: 100.5300, name: "เขตสาทร" },
  สุขุมวิท: { lat: 13.7314, lng: 100.5698, name: "สุขุมวิท (วัฒนา/คลองเตย)" },
  ดอนเมือง: { lat: 13.9130, lng: 100.5986, name: "เขตดอนเมือง" },
  บางซื่อ: { lat: 13.8042, lng: 100.5255, name: "เขตบางซื่อ" },
  รัชดา: { lat: 13.7711, lng: 100.5604, name: "รัชดาภิเษก (ดินแดง/ห้วยขวาง)" },
  ห้วยขวาง: { lat: 13.7711, lng: 100.5604, name: "เขตห้วยขวาง" },
  "พระราม 9": { lat: 13.7667, lng: 100.5714, name: "พระราม 9 (ห้วยขวาง)" },
  ดินแดง: { lat: 13.7675, lng: 100.5533, name: "เขตดินแดง" },
  ภาษีเจริญ: { lat: 13.7208, lng: 100.4535, name: "เขตภาษีเจริญ (BTS บางหว้า)" },
  ธนบุรี: { lat: 13.7250, lng: 100.4880, name: "เขตธนบุรี (วงเวียนใหญ่)" },
  นนทบุรี: { lat: 13.8621, lng: 100.5144, name: "นนทบุรี (เมืองนนทบุรี)" },
  บางแค: { lat: 13.7125, lng: 100.4078, name: "เขตบางแค" },
  พระโขนง: { lat: 13.7022, lng: 100.5997, name: "เขตพระโขนง" },
};

/**
 * Resolves the companion's current location from profile data or service areas
 */
export function getCompanionLocation(companion: {
  id?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  current_location_name?: string | null;
  service_areas?: string[] | null;
}): CompanionLocation {
  if (companion?.current_lat && companion?.current_lng) {
    return {
      lat: companion.current_lat,
      lng: companion.current_lng,
      name: companion.current_location_name || "ตำแหน่งปัจจุบันของผู้ช่วย",
    };
  }

  // Pre-configured mock companions
  if (companion?.id === "d1000000-0000-0000-0000-000000000001") {
    return { lat: 13.7557, lng: 100.4853, name: "เขตบางกอกน้อย (ใกล้ รพ.ศิริราช)" };
  }
  if (companion?.id === "d1000000-0000-0000-0000-000000000002") {
    return { lat: 13.7462, lng: 100.5347, name: "เขตปทุมวัน (สยาม - จุฬาฯ)" };
  }
  if (companion?.id === "d1000000-0000-0000-0000-000000000003") {
    return { lat: 13.8036, lng: 100.5538, name: "เขตจตุจักร (เซ็นทรัลลาดพร้าว)" };
  }
  if (companion?.id === "d1000000-0000-0000-0000-000000000004") {
    return { lat: 13.7667, lng: 100.5714, name: "เขตห้วยขวาง (พระราม 9)" };
  }

  // Look up by service area
  if (companion?.service_areas && companion.service_areas.length > 0) {
    for (const area of companion.service_areas) {
      for (const [key, loc] of Object.entries(DISTRICT_COORDINATES)) {
        if (area.includes(key) || key.includes(area)) {
          return loc;
        }
      }
    }
  }

  // Fallback default (Bangkok center)
  return {
    lat: 13.7563,
    lng: 100.5018,
    name: "เขตพระนคร (กรุงเทพมหานคร)",
  };
}

/**
 * Calculates real-world road travel distance (km) using Haversine formula + urban road curvature factor (1.25x)
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (lat1 === lat2 && lng1 === lng2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Road factor 1.25x for typical Bangkok street routing
  const roadDistance = straightDistance * 1.25;
  return Math.round(roadDistance * 10) / 10;
}

/**
 * Calculates distance fare according to the user's pricing tier:
 * - 0–2 กม. แรก: อัตราเริ่มต้นประมาณ 45 บาท
 * - กม. ที่ 2–6: คิดเพิ่มประมาณ 8 บาท/กม.
 * - กม. ที่ 6–40: คิดเพิ่มประมาณ 7 บาท/กม.
 * - กม. ที่ 40 ขึ้นไป: คิดเพิ่มประมาณ 10 บาท/กม.
 */
export function calculateDistanceFare(distanceKm: number): number {
  if (distanceKm <= 0) return 0;

  let fare = 0;
  if (distanceKm <= 2) {
    fare = 45;
  } else if (distanceKm <= 6) {
    fare = 45 + (distanceKm - 2) * 8;
  } else if (distanceKm <= 40) {
    // 0-2km: 45, 2-6km: 4 * 8 = 32
    fare = 45 + 32 + (distanceKm - 6) * 7;
  } else {
    // 0-2km: 45, 2-6km: 32, 6-40km: 34 * 7 = 238
    fare = 45 + 32 + 238 + (distanceKm - 40) * 10;
  }

  return Math.round(fare);
}

export interface BookingPricingResult {
  vehicleBaseFee: number;
  leg1Km: number; // Companion -> Pickup
  leg2Km: number; // Pickup -> Destination (or Companion -> Destination if meet at destination)
  totalDistanceKm: number;
  distanceFee: number;
  totalPrice: number;
  companionLocation: CompanionLocation;
  hasCalculatedDistance: boolean;
}

export function calculateBookingPricing({
  selectedVehicle,
  vehicleRates,
  companionLoc,
  originAddress,
  originLat,
  originLng,
  destinationAddress,
  destinationLat,
  destinationLng,
  isMeetAtDestination,
}: {
  selectedVehicle: "car" | "motorcycle" | "none" | null;
  vehicleRates: { carRate: number; motorcycleRate: number; baseRate: number };
  companionLoc: CompanionLocation;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  isMeetAtDestination: boolean;
}): BookingPricingResult {
  // 1. Determine Vehicle Base Fee
  let vehicleBaseFee = 0;
  if (selectedVehicle === "car") {
    vehicleBaseFee = vehicleRates.carRate;
  } else if (selectedVehicle === "motorcycle") {
    vehicleBaseFee = vehicleRates.motorcycleRate;
  } else if (selectedVehicle === "none") {
    vehicleBaseFee = 0; // พบกันที่จุดหมาย: ไม่มีค่าพาหนะ
  } else {
    vehicleBaseFee = 0; // ยังไม่เลือกพาหนะ
  }

  // 2. Check if locations are provided
  const hasDestination =
    Boolean(destinationAddress?.trim()) &&
    destinationLat !== null &&
    destinationLng !== null;

  const hasOrigin =
    Boolean(originAddress?.trim()) &&
    originLat !== null &&
    originLng !== null;

  let leg1Km = 0;
  let leg2Km = 0;
  let totalDistanceKm = 0;
  let hasCalculatedDistance = false;

  if (isMeetAtDestination) {
    if (hasDestination) {
      // Meet at destination: Distance = Companion -> Destination
      leg1Km = 0;
      leg2Km = calculateDistanceKm(
        companionLoc.lat,
        companionLoc.lng,
        destinationLat!,
        destinationLng!
      );
      totalDistanceKm = leg2Km;
      hasCalculatedDistance = true;
    }
  } else {
    if (hasOrigin && hasDestination) {
      // Leg 1: Companion traveling to customer's pickup point
      leg1Km = calculateDistanceKm(
        companionLoc.lat,
        companionLoc.lng,
        originLat!,
        originLng!
      );
      // Leg 2: Journey from pickup point to destination
      leg2Km = calculateDistanceKm(
        originLat!,
        originLng!,
        destinationLat!,
        destinationLng!
      );
      totalDistanceKm = Math.round((leg1Km + leg2Km) * 10) / 10;
      hasCalculatedDistance = true;
    }
  }

  // 3. Distance Fee
  const distanceFee = hasCalculatedDistance
    ? calculateDistanceFare(totalDistanceKm)
    : 0;

  // 4. Total Price
  const totalPrice = vehicleBaseFee + distanceFee;

  return {
    vehicleBaseFee,
    leg1Km,
    leg2Km,
    totalDistanceKm,
    distanceFee,
    totalPrice,
    companionLocation: companionLoc,
    hasCalculatedDistance,
  };
}
