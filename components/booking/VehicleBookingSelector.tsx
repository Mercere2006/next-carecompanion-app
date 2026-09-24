'use client';

import React from 'react';
import { Car, Footprints, Check } from 'lucide-react';
import { ParsedVehicleInfo } from '@/lib/vehicleUtils';

interface VehicleBookingSelectorProps {
  vehicleDetails: ParsedVehicleInfo | null;
  selectedVehicle: 'car' | 'motorcycle' | 'none';
  onSelectVehicle: (v: 'car' | 'motorcycle' | 'none') => void;
}

export default function VehicleBookingSelector({
  vehicleDetails,
  selectedVehicle,
  onSelectVehicle,
}: VehicleBookingSelectorProps) {
  if (!vehicleDetails) return null;

  const { hasCar, hasMotorcycle, car, motorcycle, baseRate } = vehicleDetails;

  // If companion has neither car nor motorcycle, don't show the complex selection, just a note
  if (!hasCar && !hasMotorcycle) {
    return (
      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-gray-200">
        <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Footprints className="w-4 h-4 text-emerald-700" />
          <span>ยานพาหนะในการร่วมเดินทาง</span>
        </label>
        <p className="text-xs text-gray-600">
          ผู้ช่วยท่านนี้ให้บริการด้วยระบบขนส่งสาธารณะ (BTS / MRT / แท็กซี่) หรือพบกัน ณ จุดนัดหมาย (อัตราค่าบริการ {baseRate} บ./ชม.)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/80 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Car className="w-4 h-4 text-emerald-700" />
          <span>เลือกยานพาหนะสำหรับร่วมเดินทาง</span>
          <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-gray-500">
          อัตราค่าบริการและยอดรวมจะปรับเปลี่ยนตามพาหนะที่คุณเลือก
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: Car */}
        {hasCar && (
          <button
            type="button"
            onClick={() => onSelectVehicle('car')}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
              selectedVehicle === 'car'
                ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🚗</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    selectedVehicle === 'car'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {selectedVehicle === 'car' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="font-bold text-sm text-gray-900">รถยนต์ส่วนตัว</div>
              <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                {car.model || 'รถยนต์ส่วนตัว'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                นั่งสบาย ปลอดภัยสูง รองรับผู้สูงอายุและวีลแชร์
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
              <span className="text-[10px] text-gray-400 font-medium">ค่าบริการ</span>
              <span className="text-sm font-black text-emerald-700">
                ฿{car.rate}
              </span>
            </div>
          </button>
        )}

        {/* Option 2: Motorcycle */}
        {hasMotorcycle && (
          <button
            type="button"
            onClick={() => onSelectVehicle('motorcycle')}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
              selectedVehicle === 'motorcycle'
                ? 'border-teal-600 bg-white shadow-md ring-2 ring-teal-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🛵</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    selectedVehicle === 'motorcycle'
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {selectedVehicle === 'motorcycle' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="font-bold text-sm text-gray-900">รถจักรยานยนต์</div>
              <div className="text-[11px] text-teal-800 font-semibold mt-0.5">
                {motorcycle.model || 'มอเตอร์ไซค์'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                สะดวกรวดเร็ว คล่องตัว เหมาะสำหรับธุระด่วน
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
              <span className="text-[10px] text-gray-400 font-medium">ค่าบริการ</span>
              <span className="text-sm font-black text-teal-700">
                ฿{motorcycle.rate}
              </span>
            </div>
          </button>
        )}

        {/* Option 3: Public transport / meet at destination */}
        <button
          type="button"
          onClick={() => onSelectVehicle('none')}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
            selectedVehicle === 'none'
              ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white/70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🚶</span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedVehicle === 'none'
                    ? 'bg-emerald-600 text-white'
                    : 'border border-gray-300 bg-white'
                }`}
              >
                {selectedVehicle === 'none' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="font-bold text-sm text-gray-900">พบกันที่จุดหมาย</div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              ขนส่งสาธารณะ / แท็กซี่
            </div>
            <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              ผู้ช่วยเดินทางไปพบตามโรงพยาบาลหรือสถานที่นัดหมาย
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
            <span className="text-[10px] text-gray-400 font-medium">ค่าบริการ</span>
            <span className="text-sm font-black text-gray-800">
              ฿{baseRate} <span className="text-[10px] font-normal text-gray-500">/ชม.</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
