'use client';

import { Car, Bike, ShieldCheck, Check, Info } from 'lucide-react';

interface VehicleSelectorProps {
  hasCar: boolean;
  setHasCar: (val: boolean) => void;
  carModel: string;
  setCarModel: (val: string) => void;
  carPlate: string;
  setCarPlate: (val: string) => void;
  carRate: number;
  setCarRate: (val: number) => void;

  hasMotorcycle: boolean;
  setHasMotorcycle: (val: boolean) => void;
  motorcycleModel: string;
  setMotorcycleModel: (val: string) => void;
  motorcyclePlate: string;
  setMotorcyclePlate: (val: string) => void;
  motorcycleRate: number;
  setMotorcycleRate: (val: number) => void;

  disabled?: boolean;
}

export default function VehicleSelector({
  hasCar,
  setHasCar,
  carModel,
  setCarModel,
  carPlate,
  setCarPlate,
  carRate,
  setCarRate,
  hasMotorcycle,
  setHasMotorcycle,
  motorcycleModel,
  setMotorcycleModel,
  motorcyclePlate,
  setMotorcyclePlate,
  motorcycleRate,
  setMotorcycleRate,
  disabled = false,
}: VehicleSelectorProps) {
  const isNoVehicle = !hasCar && !hasMotorcycle;

  return (
    <div className="space-y-4 border-t border-gray-100 pt-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-700" />
          <span>ประเภทยานพาหนะในการให้บริการ (เลือกได้มากกว่า 1 ประเภท)</span>
        </label>
        <span className="text-xs text-gray-500">
          สามารถเลือกทั้งรถยนต์และมอเตอร์ไซค์ได้
        </span>
      </div>

      {/* 3 Main Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. ไม่มีพาหนะ / ขนส่งสาธารณะ */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setHasCar(false);
            setHasMotorcycle(false);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
            isNoVehicle
              ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🚶</span>
              {isNoVehicle && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="font-bold text-sm text-gray-900">ไม่มีพาหนะส่วนตัว</div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">
              ร่วมเดินทางด้วย BTS/MRT, รถเมล์ หรือแท็กซี่
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700">
            เรตทั่วไป: 200 - 250 บาท
          </div>
        </button>

        {/* 2. รถยนต์ส่วนตัว */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const nextVal = !hasCar;
            setHasCar(nextVal);
            if (nextVal && carRate < 350) setCarRate(350);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
            hasCar
              ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🚗</span>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                  hasCar
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {hasCar && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>รถยนต์ส่วนตัว</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">
              สะดวกสบาย ปลอดภัยสูง รองรับสัมภาระ
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700">
            เรตแนะนำ: 350 - 500+ บาท
          </div>
        </button>

        {/* 3. รถมอเตอร์ไซค์ */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const nextVal = !hasMotorcycle;
            setHasMotorcycle(nextVal);
            if (nextVal && motorcycleRate < 250) setMotorcycleRate(280);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between ${
            hasMotorcycle
              ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-2 ring-teal-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🛵</span>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                  hasMotorcycle
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {hasMotorcycle && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>รถจักรยานยนต์ (มอเตอร์ไซค์)</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">
              สะดวกรวดเร็ว คล่องตัว เหมาะกับธุระด่วนในเมือง
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-teal-700">
            เรตแนะนำ: 250 - 320 บาท
          </div>
        </button>
      </div>

      {/* When both are selected notification */}
      {hasCar && hasMotorcycle && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">คุณเปิดรับงานด้วยยานพาหนะทั้ง 2 ประเภท!</strong>
            <p className="mt-0.5 text-amber-800">
              เมื่อลูกค้าทำการจอง ลูกค้าจะสามารถเลือกระหว่าง <strong>&ldquo;รถยนต์&rdquo;</strong> หรือ <strong>&ldquo;มอเตอร์ไซค์&rdquo;</strong> ได้ตามความสะดวกของผู้สูงอายุ และระบบจะคิดอัตราค่าบริการตามประเภทที่ลูกค้าเลือกโดยอัตโนมัติ
            </p>
          </div>
        </div>
      )}

      {/* Input Form 1: Car Details */}
      {hasCar && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-700" />
              <span>ข้อมูลรถยนต์ส่วนตัว</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-normal">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ซ่อนเลขทะเบียนสำหรับผู้ไม่ได้ล็อกอิน</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                ยี่ห้อ / รุ่น / สีรถยนต์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                required={hasCar}
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder="เช่น Honda City สีขาว หรือ Toyota Yaris สีเทา"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                หมายเลขทะเบียนรถยนต์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                required={hasCar}
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                placeholder="เช่น 1กข 1234 กทม."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                ค่าบริการรถยนต์ (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                disabled={disabled}
                required={hasCar}
                value={carRate}
                onChange={(e) => setCarRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Form 2: Motorcycle Details */}
      {hasMotorcycle && (
        <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-teal-900 border-b border-teal-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-teal-700" />
              <span>ข้อมูลรถจักรยานยนต์</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-normal">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ซ่อนเลขทะเบียนสำหรับผู้ไม่ได้ล็อกอิน</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                ยี่ห้อ / รุ่น / สีมอเตอร์ไซค์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                required={hasMotorcycle}
                value={motorcycleModel}
                onChange={(e) => setMotorcycleModel(e.target.value)}
                placeholder="เช่น Yamaha Grand Filano สีฟ้า หรือ Honda Wave สีดำ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                หมายเลขทะเบียนมอเตอร์ไซค์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                required={hasMotorcycle}
                value={motorcyclePlate}
                onChange={(e) => setMotorcyclePlate(e.target.value)}
                placeholder="เช่น 2กข 5678 กทม."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">
                ค่าบริการมอเตอร์ไซค์ (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                disabled={disabled}
                required={hasMotorcycle}
                value={motorcycleRate}
                onChange={(e) => setMotorcycleRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
