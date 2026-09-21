'use client';

import Link from 'next/link';
import {
  User,
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Save,
} from 'lucide-react';
import VehicleSelector from './VehicleSelector';

interface CompanionDetailsFormProps {
  isVerified: boolean;
  isProfileSaved?: boolean;
  saving: boolean;
  titlePrefix: 'นาย' | 'นาง' | 'นางสาว';
  setTitlePrefix: (val: 'นาย' | 'นาง' | 'นางสาว') => void;
  rawName: string;
  setRawName: (val: string) => void;
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
  bio: string;
  setBio: (val: string) => void;
  experienceYears: number;
  setExperienceYears: (val: number) => void;
  hourlyRate: number;
  setHourlyRate: (val: number) => void;
  availableSchedule: string;
  setAvailableSchedule: (val: string) => void;
  skillsText: string;
  setSkillsText: (val: string) => void;
  serviceAreasText: string;
  setServiceAreasText: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export default function CompanionDetailsForm({
  isVerified,
  isProfileSaved,
  saving,
  titlePrefix,
  setTitlePrefix,
  rawName,
  setRawName,
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
  bio,
  setBio,
  experienceYears,
  setExperienceYears,
  hourlyRate,
  setHourlyRate,
  availableSchedule,
  setAvailableSchedule,
  skillsText,
  setSkillsText,
  serviceAreasText,
  setServiceAreasText,
  onSubmit,
}: CompanionDetailsFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-gray-200/80 shadow-xs space-y-6 transition-all ${
        !isVerified ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
      }`}
    >
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <span>ขั้นตอนที่ 2: กรอกรายละเอียดการให้บริการและยานพาหนะ (Companion Details)</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          ข้อมูลเหล่านี้จะนำไปแสดงบนการ์ดผู้ช่วยในหน้าค้นหาเพื่อให้ Customer ใช้ประกอบการตัดสินใจจอง
        </p>
      </div>

      {/* Full Name Input */}
      <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-gray-200">
        <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <User className="w-4 h-4 text-emerald-700" />
          <span>ชื่อ - นามสกุลจริง (Full Name)</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            disabled={!isVerified}
            value={titlePrefix}
            onChange={(e) => setTitlePrefix(e.target.value as 'นาย' | 'นาง' | 'นางสาว')}
            aria-label="คำนำหน้า"
            className="w-24 sm:w-28 px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:bg-gray-100 shrink-0"
          >
            <option value="นาย">นาย</option>
            <option value="นาง">นาง</option>
            <option value="นางสาว">นางสาว</option>
          </select>
          <input
            type="text"
            disabled={!isVerified}
            required
            value={rawName}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, '');
              setRawName(cleaned);
            }}
            placeholder="เช่น สมชาย บริรักษ์ หรือ วิมล สุขเกษม"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
        <p className="text-[11px] text-gray-500">
          *ชื่อนี้จะแสดงบนการ์ดค้นหาผู้ช่วยและเอกสารการนัดหมายร่วมเดินทางของลูกค้า
        </p>
      </div>

      {/* VEHICLE & TRANSPORTATION OPTIONS */}
      <VehicleSelector
        hasCar={hasCar}
        setHasCar={setHasCar}
        carModel={carModel}
        setCarModel={setCarModel}
        carPlate={carPlate}
        setCarPlate={setCarPlate}
        carRate={carRate}
        setCarRate={setCarRate}
        hasMotorcycle={hasMotorcycle}
        setHasMotorcycle={setHasMotorcycle}
        motorcycleModel={motorcycleModel}
        setMotorcycleModel={setMotorcycleModel}
        motorcyclePlate={motorcyclePlate}
        setMotorcyclePlate={setMotorcyclePlate}
        motorcycleRate={motorcycleRate}
        setMotorcycleRate={setMotorcycleRate}
        disabled={!isVerified}
      />

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-900">
          แนะนำตัว / ประสบการณ์ (Bio)
        </label>
        <textarea
          rows={4}
          disabled={!isVerified}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="แนะนำตัว ประสบการณ์การดูแล ความถนัด และอัธยาศัยของคุณ..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 disabled:bg-gray-100"
        />
      </div>

      {/* Experience & Hourly Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            ประสบการณ์ดูแล/ร่วมเดินทาง (ปี)
          </label>
          <input
            type="number"
            min="0"
            max="40"
            disabled={!isVerified}
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>
                {hasCar || hasMotorcycle
                  ? 'อัตราค่าบริการพื้นฐาน / ขนส่งสาธารณะ (บาท/ชม.)'
                  : 'อัตราค่าบริการต่อชั่วโมง (บาท)'}
              </span>
            </label>
          </div>
          <input
            type="number"
            min="50"
            max="2000"
            step="10"
            disabled={!isVerified}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100 font-bold"
          />
          {(hasCar || hasMotorcycle) && (
            <p className="text-[11px] text-gray-500">
              *ใช้สำหรับกรณีเดินทางด้วยรถสาธารณะ / นัดพบที่ปลายทาง (หากลูกค้าเลือกใช้รถยนต์หรือมอเตอร์ไซค์ ระบบจะคิดเรตราคาของยานพาหนะนั้น)
            </p>
          )}
        </div>
      </div>

      {/* Available Schedule */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          ช่วงเวลาที่สะดวกให้บริการ (Available Schedule) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          disabled={!isVerified}
          value={availableSchedule}
          onChange={(e) => setAvailableSchedule(e.target.value)}
          placeholder="เช่น จันทร์ - ศุกร์ (08:30 - 16:30 น.)"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
        />
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-900">
          ทักษะและความสามารถ (คั่นด้วยเครื่องหมายจุลภาค ,)
        </label>
        <input
          type="text"
          disabled={!isVerified}
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="เช่น ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
        />
      </div>

      {/* Service Areas */}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          พื้นที่ให้บริการที่สะดวก (คั่นด้วยเครื่องหมายจุลภาค ,)
        </label>
        <input
          type="text"
          disabled={!isVerified}
          value={serviceAreasText}
          onChange={(e) => setServiceAreasText(e.target.value)}
          placeholder="เช่น พญาไท, บางกอกน้อย, ราชเทวี"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 disabled:bg-gray-100"
        />
      </div>

      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        {isProfileSaved && (
          <Link
            href="/companion/dashboard"
            className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-sm hover:bg-teal-100 transition inline-flex items-center gap-2 text-center"
          >
            <Briefcase className="w-4 h-4 text-teal-700" />
            ไปยังแดชบอร์ดงานของฉัน ➔
          </Link>
        )}
        <button
          type="submit"
          disabled={saving || !isVerified}
          className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition shadow-md shadow-teal-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์และยานพาหนะ'}
        </button>
      </div>
    </form>
  );
}
