import React from "react";
import { formatPrice } from "@/lib/utils";
import { Car, Bike, Footprints } from "lucide-react";
import { CompanionVehicleInfo } from "./useBookingForm";

interface BookingHeaderProps {
  companionName: string;
  companionRate: number;
  companionVehicle: CompanionVehicleInfo | null;
  totalPrice: number;
}

export default function BookingHeader({
  companionName,
  companionRate,
  companionVehicle,
  totalPrice,
}: BookingHeaderProps) {
  return (
    <div className="border-b border-gray-100 pb-5 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Booking Request
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-950 mt-2 break-words">
          นัดหมายผู้ช่วยร่วมเดินทาง
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <p className="text-xs sm:text-sm text-gray-600">
            ผู้ช่วยของคุณ:{" "}
            <strong className="text-emerald-700">{companionName}</strong> (
            {formatPrice(companionRate)}/ชม.)
          </p>
          {companionVehicle && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                companionVehicle.type === "car"
                  ? "bg-emerald-100 text-emerald-800"
                  : companionVehicle.type === "motorcycle"
                    ? "bg-teal-100 text-teal-800"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {companionVehicle.type === "car" ? (
                <>
                  <Car className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    มีรถยนต์ส่วนตัว{" "}
                    {companionVehicle.model ? `(${companionVehicle.model})` : ""}
                  </span>
                </>
              ) : companionVehicle.type === "motorcycle" ? (
                <>
                  <Bike className="w-3.5 h-3.5 text-teal-700" />
                  <span>
                    มีมอเตอร์ไซค์{" "}
                    {companionVehicle.model ? `(${companionVehicle.model})` : ""}
                  </span>
                </>
              ) : (
                <>
                  <Footprints className="w-3.5 h-3.5 text-gray-500" />
                  <span>ขนส่งสาธารณะ / นัดพบตามจุดนัด</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="text-left sm:text-right bg-emerald-50 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-emerald-200 shrink-0 w-full sm:w-auto flex sm:block justify-between items-center">
        <span className="text-xs text-emerald-800 font-medium block">
          ประเมินราคารวม
        </span>
        <span className="text-xl sm:text-2xl font-black text-emerald-700">
          {formatPrice(totalPrice)}
        </span>
      </div>
    </div>
  );
}
