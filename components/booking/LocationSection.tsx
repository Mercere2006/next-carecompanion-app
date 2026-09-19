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
}: LocationSectionProps) {
  return (
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
          onAddressChange={onOriginAddressChange}
          onCoordinatesChange={onOriginCoordinatesChange}
          placeholder="เช่น คอนโด ลุมพินี พาร์ค พระราม 9 หรือ เขตบางกอกน้อย"
        />

        <LocationPicker
          label="จุดหมายปลายทาง / จุดส่ง"
          pinColor="red"
          address={destinationAddress}
          lat={destinationLat}
          lng={destinationLng}
          onAddressChange={onDestinationAddressChange}
          onCoordinatesChange={onDestinationCoordinatesChange}
          placeholder="เช่น โรงพยาบาลศิริราช ตึกสยามินทร์"
        />
      </div>
    </div>
  );
}
