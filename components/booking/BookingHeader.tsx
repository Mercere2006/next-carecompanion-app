import React from "react";
import { formatPrice } from "@/lib/utils";
import { Car, Bike, Footprints, Check, User } from "lucide-react";
import { CompanionVehicleInfo } from "./useBookingForm";

interface BookingHeaderProps {
  companionName: string;
  companionRate?: number;
  companionVehicle: CompanionVehicleInfo | null;
  companionAvatar?: string | null;
  companionLocationName?: string;
}

export default function BookingHeader({
  companionName,
  companionRate,
  companionVehicle,
  companionAvatar,
  companionLocationName,
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
            <strong className="text-emerald-700">{companionName}</strong>
            {companionLocationName && (
              <span className="text-gray-500 font-normal ml-1">
                (พิกัดเริ่มต้น: <span className="font-semibold text-gray-700">{companionLocationName}</span>)
              </span>
            )}
          </p>
          {companionVehicle && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                companionVehicle.type === "car"
                  ? "bg-emerald-100 text-emerald-800"
                  : companionVehicle.type === "motorcycle"
                    ? "bg-teal-100 text-teal-800"
                    : companionVehicle.type === "both"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {companionVehicle.type === "both" ? (
                <>
                  <Car className="w-3.5 h-3.5 text-indigo-700" />
                  <Bike className="w-3.5 h-3.5 text-indigo-700" />
                  <span>มียานพาหนะ (รถยนต์และมอเตอร์ไซค์)</span>
                </>
              ) : companionVehicle.type === "car" ? (
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
      <div className="shrink-0 flex items-center self-start sm:self-center">
        {companionAvatar ? (
          <div className="relative">
            <img
              src={companionAvatar}
              alt={companionName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md"
            />
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs"
              title="ผู้ช่วยที่ได้รับการรับรอง"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-500/20 flex flex-col items-center justify-center shadow-xs">
            <User className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            <span className="text-[9px] font-bold mt-0.5 text-emerald-800">ผู้ช่วย</span>
          </div>
        )}
      </div>
    </div>
  );
}
