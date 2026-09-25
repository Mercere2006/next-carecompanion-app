import React from "react";
import LocationPicker from "@/components/maps/LocationPicker";

interface LocationSectionProps {
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  onOriginAddressChange: (address: string) => void;
  onOriginCoordinatesChange: (lat: number | null, lng: number | null) => void;
  onDestinationAddressChange: (address: string) => void;
  onDestinationCoordinatesChange: (
    lat: number | null,
    lng: number | null,
  ) => void;
  isMeetAtDestination?: boolean;
  companionLocationName?: string;
  totalDistanceKm?: number;
  distanceFee?: number;
  leg1Km?: number;
  leg2Km?: number;
  hasCalculatedDistance?: boolean;
  hasOriginError?: boolean;
  hasDestinationError?: boolean;
}

export default function LocationSection({
  originAddress,
  originLat,
  originLng,
  destinationAddress,
  destinationLat,
  destinationLng,
  onOriginAddressChange,
  onOriginCoordinatesChange,
  onDestinationAddressChange,
  onDestinationCoordinatesChange,
  isMeetAtDestination = false,
  companionLocationName,
  totalDistanceKm,
  distanceFee = 0,
  leg1Km,
  leg2Km,
  hasCalculatedDistance = false,
  hasOriginError = false,
  hasDestinationError = false,
}: LocationSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-900">
          3. ระบุสถานที่และปักหมุดแผนที่ <span className="text-rose-500">*</span>
        </h3>
        {isMeetAtDestination && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>🚶</span> นัดพบกันที่จุดหมายปลายทาง
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationPicker
          id="origin-address-input"
          label="จุดรับผู้เดินทาง"
          pinColor="green"
          address={originAddress}
          lat={originLat}
          lng={originLng}
          onAddressChange={onOriginAddressChange}
          onCoordinatesChange={onOriginCoordinatesChange}
          placeholder="เช่น คอนโด ลุมพินี พาร์ค พระราม 9 หรือ เขตบางกอกน้อย"
          allowCurrentLocation={!isMeetAtDestination}
          disabled={isMeetAtDestination}
          disabledNotice="พบกันที่จุดหมาย (ช่องนี้ปิดการใช้งาน ไม่จำเป็นต้องระบุจุดรับ)"
          hasError={hasOriginError}
          errorMessage="กรุณาระบุจุดรับผู้เดินทาง หรือเลือกพบกันที่จุดหมาย"
        />

        <LocationPicker
          id="destination-address-input"
          label="จุดหมายปลายทาง"
          pinColor="red"
          address={destinationAddress}
          lat={destinationLat}
          lng={destinationLng}
          onAddressChange={onDestinationAddressChange}
          onCoordinatesChange={onDestinationCoordinatesChange}
          placeholder="เช่น มหาวิทยาลัยสยาม, โรงพยาบาลศิริราช"
          allowCurrentLocation={false}
          hasError={hasDestinationError}
          errorMessage="กรุณาระบุจุดหมายปลายทาง"
        />
      </div>

      {hasCalculatedDistance && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
              <span>🧭</span>
              คำนวณระยะทางจากพิกัดจริง
            </span>
            <span className="text-emerald-800 font-extrabold text-xs sm:text-sm bg-emerald-100/80 px-2.5 py-1 rounded-xl">
              ค่าระยะทาง +฿{distanceFee}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 pt-1 border-t border-emerald-100">
            <div>
              <span className="text-gray-500">📍 พิกัดล่าสุดผู้ช่วย: </span>
              <strong className="text-gray-900">{companionLocationName}</strong>
            </div>
            <div>
              <span className="text-gray-500">📏 ระยะทางรวม: </span>
              <strong className="text-emerald-800 font-black text-sm">{totalDistanceKm} กม.</strong>
              <span className="text-gray-400 text-[11px] ml-1">
                {leg1Km && leg1Km > 0 ? `(มารับ ${leg1Km} กม. + เดินทาง ${leg2Km} กม.)` : `(เดินทาง ${leg2Km} กม.)`}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800/80 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-200/50 flex flex-wrap items-center justify-between gap-1">
            <span>
              💡 อัตราตามระยะทาง: 0–2 กม. (฿45) • 2–6 กม. (8 บ./กม.) • 6–40 กม. (7 บ./กม.) • 40+ กม. (10 บ./กม.)
            </span>
            {leg1Km !== undefined && leg1Km <= 3 && (
              <span className="font-semibold text-emerald-700">✨ ผู้ช่วยอยู่ใกล้จุดที่คุณเลือก ค่าเดินทางจึงถูกลง</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
