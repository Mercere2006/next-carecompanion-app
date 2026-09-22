'use client';

import { useState } from 'react';
import {
  User,
  Briefcase,
  Clock,
  MapPin,
  Save,
  Trash2,
  Camera,
  Pencil,
  Plus,
  Car,
  Bike,
  CheckCircle2,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react';
import { VehicleEntry } from '@/lib/vehicleUtils';
import AvatarPickerModal from './AvatarPickerModal';
import VehicleManagerModal from './VehicleManagerModal';

interface CompanionDetailsFormProps {
  isVerified: boolean;
  isProfileSaved?: boolean;
  saving: boolean;
  hasUnsavedChanges?: boolean;
  avatarUrl: string | null;
  setAvatarUrl: (val: string) => void;
  titlePrefix: 'นาย' | 'นาง' | 'นางสาว';
  setTitlePrefix: (val: 'นาย' | 'นาง' | 'นางสาว') => void;
  rawName: string;
  setRawName: (val: string) => void;
  nameChangeCount: number;
  phone: string;
  vehicles: VehicleEntry[];
  setVehicles: React.Dispatch<React.SetStateAction<VehicleEntry[]>>;
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
  onDeleteProfile: () => void;
}

export default function CompanionDetailsForm({
  isVerified,
  saving,
  hasUnsavedChanges = false,
  avatarUrl,
  setAvatarUrl,
  titlePrefix,
  setTitlePrefix,
  rawName,
  setRawName,
  nameChangeCount,
  phone,
  vehicles,
  setVehicles,
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
  onDeleteProfile,
}: CompanionDetailsFormProps) {
  // Modal states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleEntry | null>(null);

  // Field edit states (default to false = locked/grayed out mode)
  const [editName, setEditName] = useState(false);
  const [editVehicles, setEditVehicles] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [editSchedule, setEditSchedule] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [editAreas, setEditAreas] = useState(false);

  const remainingNameChanges = Math.max(0, 3 - (nameChangeCount || 0));
  const isNameLocked = remainingNameChanges <= 0;

  // Handle adding/editing vehicle
  const handleSaveVehicle = (vehicle: VehicleEntry) => {
    setVehicles((prev) => {
      const existingIdx = prev.findIndex((v) => v.id === vehicle.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = vehicle;
        return next;
      }
      return [...prev, vehicle];
    });
    setEditingVehicle(null);
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };

  // Preset helpers for schedule
  const schedulePresets = [
    'จันทร์ - ศุกร์ (08:30 - 17:30 น.)',
    'ทุกวัน (08:00 - 18:00 น.)',
    'เสาร์ - อาทิตย์ (09:00 - 18:00 น.)',
    'ช่วงเช้า (07:00 - 12:00 น.)',
  ];

  // Quick skill tags helper
  const addSkillTag = (tag: string) => {
    const list = skillsText ? skillsText.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!list.includes(tag)) {
      setSkillsText(list.length > 0 ? `${skillsText}, ${tag}` : tag);
    }
  };

  // Quick area tags helper
  const addAreaTag = (tag: string) => {
    const list = serviceAreasText ? serviceAreasText.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!list.includes(tag)) {
      setServiceAreasText(list.length > 0 ? `${serviceAreasText}, ${tag}` : tag);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`transition-all ${
        !isVerified ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
      }`}
    >
      {/* SINGLE UNIFIED CONTINUOUS FORM CONTAINER (ข้อมูลยาวลงมา ไม่เป็นบล็อกแยก) */}
      <div className="bg-white rounded-3xl p-5 sm:p-9 border border-gray-200/90 shadow-sm space-y-7">
        
        {/* 1. TOP HEADER: PROFILE AVATAR & BASIC DETAILS */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-gray-100">
          {/* Avatar with Camera Trigger */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => setIsAvatarModalOpen(true)}
            title="กดเพื่อเปลี่ยนรูปโปรไฟล์ (ถ่ายภาพ หรือ เลือกจากแกลเลอรี)"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-emerald-300 shadow-md bg-emerald-50 flex items-center justify-center transition group-hover:scale-105">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-emerald-600" />
              )}
            </div>
            {/* Camera badge */}
            <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:bg-emerald-800 transition">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                {titlePrefix} {rawName || 'ผู้ให้บริการร่วมเดินทาง'}
              </h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ยืนยันตัวตนแล้ว
              </span>
            </div>

            <p className="text-xs text-gray-500 max-w-xl">
              ข้อมูลทั้งหมดด้านล่างอยู่ในโหมดล็อกป้องกันการแก้ไขโดยไม่ได้ตั้งใจ (สีเทา) หากต้องการแก้ไขส่วนใด ให้แตะที่ไอคอนดินสอ ✏️ ของส่วนนั้น
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                เปลี่ยนรูปโปรไฟล์ (ถ่ายรูป / แกลเลอรี)
              </button>
            </div>
          </div>
        </div>

        {/* 2. ROW: FULL NAME (ชื่อ - นามสกุลจริง พร้อมโควตา 3 ครั้ง) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>ชื่อ - นามสกุลจริง (แสดงบนระบบค้นหา)</span>
              <span className="text-rose-500">*</span>
            </label>

            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isNameLocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isNameLocked ? (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  เปลี่ยนชื่อครบ 3 ครั้งแล้ว
                </span>
              ) : (
                `สิทธิ์เปลี่ยนชื่อคงเหลือ: ${remainingNameChanges} / 3 ครั้ง`
              )}
            </span>
          </div>

          {editName ? (
            /* ACTIVE EDITING STATE */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  แก้ไขชื่อ-นามสกุล
                </span>
                <button
                  type="button"
                  onClick={() => setEditName(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  เสร็จสิ้น
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <select
                    disabled={isNameLocked}
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value as 'นาย' | 'นาง' | 'นางสาว')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    disabled={isNameLocked}
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    placeholder="เช่น สมศรี ใจดี"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* LOCKED / GRAY STATE */
            <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700">
              <div className="flex items-center min-w-0">
                <span className="font-semibold text-sm sm:text-base text-slate-800 truncate">
                  {titlePrefix} {rawName || 'ยังไม่ได้ระบุชื่อ'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isNameLocked) setEditName(true);
                }}
                disabled={isNameLocked}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700"
                title={isNameLocked ? 'เปลี่ยนชื่อครบ 3 ครั้งแล้ว' : 'กดเพื่อแก้ไขชื่อ'}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isNameLocked ? 'ล็อกถาวร' : 'แก้ไขชื่อ'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. ROW: PHONE NUMBER (เบอร์โทรศัพท์ติดต่อ - ยืนยันแล้ว) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span>เบอร์โทรศัพท์ติดต่อ (ยืนยันผ่าน OTP แล้ว)</span>
            <span className="text-[11px] text-slate-400">ล็อกตามการยืนยันตัวตน</span>
          </label>

          <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600">
            <div className="flex items-center">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-700">
                {phone || 'ยังไม่มีเบอร์โทร'}
              </span>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ผ่านการตรวจสอบแล้ว
            </span>
          </div>
        </div>

        {/* 4. ROW: MULTI-VEHICLE MANAGEMENT (ยานพาหนะ) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-teal-600" />
              <span>ยานพาหนะในการร่วมเดินทาง ({vehicles.length} คัน)</span>
            </label>

            {!editVehicles && (
              <button
                type="button"
                onClick={() => setEditVehicles(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไขยานพาหนะ</span>
              </button>
            )}
          </div>

          {editVehicles ? (
            /* ACTIVE EDITING STATE FOR VEHICLES */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-4 transition">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">
                    จัดการยานพาหนะ (เพิ่ม / แก้ไข / ลบ)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicle(null);
                      setIsVehicleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มยานพาหนะ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVehicles(false)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    เสร็จสิ้น
                  </button>
                </div>
              </div>

              {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl border-2 border-emerald-200 bg-white space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              v.type === 'car'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {v.type === 'car' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {v.type === 'car' ? '🚗 รถยนต์' : '🛵 มอเตอร์ไซค์'}
                            </span>
                            <h4 className="font-bold text-xs text-gray-950 truncate mt-0.5">
                              {v.model}
                            </h4>
                          </div>
                        </div>
                        <span className="font-extrabold text-xs text-emerald-700">
                          ฿{v.rate}/ชม.
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-100">
                        <span className="font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-gray-200">
                          {v.plate}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVehicle(v);
                              setIsVehicleModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="แก้ไขคันนี้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(v.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบคันนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white/80 rounded-xl border border-dashed border-emerald-200 p-4 space-y-2">
                  <p className="text-xs text-gray-500">ยังไม่มีข้อมูลยานพาหนะ กดปุ่มเพิ่มด้านบนได้เลย</p>
                </div>
              )}
            </div>
          ) : (
            /* LOCKED / GRAY STATE FOR VEHICLES */
            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700">
              {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-white/70 border border-slate-200/90 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                          {v.type === 'car' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">
                            {v.type === 'car' ? '🚗 รถยนต์' : '🛵 มอเตอร์ไซค์'}: {v.model}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 truncate">
                            ทะเบียน: {v.plate}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs text-slate-800 block">
                          ฿{v.rate}/ชม.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 bg-white/50 rounded-xl border border-dashed border-slate-300">
                  ไม่มีข้อมูลยานพาหนะส่วนตัว (ระบบคิดค่าบริการตามเรตขนส่งสาธารณะ)
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. ROW: BIO & EXPERIENCE & BASE RATE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>แนะนำตัว ประสบการณ์ และเรตราคาพื้นฐาน</span>
            </label>

            {!editBio && (
              <button
                type="button"
                onClick={() => setEditBio(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
          </div>

          {editBio ? (
            /* ACTIVE EDITING STATE FOR BIO */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  แก้ไขข้อความแนะนำตัวและประสบการณ์
                </span>
                <button
                  type="button"
                  onClick={() => setEditBio(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  เสร็จสิ้น
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  ข้อความแนะนำตัว / สไตล์การดูแล
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="เช่น อดีตบุรุษพยาบาล ใจเย็น ชำนาญเส้นทาง รพ. ช่วยดูแลผู้สูงอายุอย่างใส่ใจ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    ประสบการณ์ดูแล/ร่วมเดินทาง (ปี)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    อัตราค่าบริการพื้นฐาน / ขนส่งสาธารณะ (บาท/ชม.)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="10"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* LOCKED / GRAY STATE FOR BIO */
            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl space-y-2.5 text-slate-700">
              <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                <span>ประสบการณ์: <strong className="text-slate-800">{experienceYears} ปี</strong></span>
                <span>•</span>
                <span>เรตพื้นฐาน: <strong className="text-slate-800">฿{hourlyRate}/ชม.</strong></span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-200/80">
                {bio || 'ยังไม่มีข้อความแนะนำตัว (กดไอคอนดินสอเพื่อแก้ไข)'}
              </p>
            </div>
          )}
        </div>

        {/* 6. ROW: SCHEDULE (ช่วงเวลาที่สะดวกให้บริการ) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>ช่วงเวลาที่สะดวกให้บริการ (Schedule)</span>
            </label>

            {!editSchedule && (
              <button
                type="button"
                onClick={() => setEditSchedule(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
          </div>

          {editSchedule ? (
            /* ACTIVE EDITING STATE FOR SCHEDULE */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  แก้ไขช่วงเวลาให้บริการ
                </span>
                <button
                  type="button"
                  onClick={() => setEditSchedule(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  เสร็จสิ้น
                </button>
              </div>

              <input
                type="text"
                value={availableSchedule}
                onChange={(e) => setAvailableSchedule(e.target.value)}
                placeholder="เช่น จันทร์ - ศุกร์ (08:30 - 17:30 น.)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400">เลือกด่วน:</span>
                {schedulePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAvailableSchedule(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 border border-gray-200 transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* LOCKED / GRAY STATE FOR SCHEDULE */
            <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700">
              <div className="flex items-center min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {availableSchedule || 'ยังไม่ได้ระบุช่วงเวลา (กดไอคอนดินสอเพื่อแก้ไข)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7. ROW: SKILLS (ทักษะและความสามารถ) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>ทักษะและความสามารถ (Skills)</span>
            </label>

            {!editSkills && (
              <button
                type="button"
                onClick={() => setEditSkills(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
          </div>

          {editSkills ? (
            /* ACTIVE EDITING STATE FOR SKILLS */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  แก้ไขทักษะและความสามารถ
                </span>
                <button
                  type="button"
                  onClick={() => setEditSkills(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  เสร็จสิ้น
                </button>
              </div>

              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="เช่น ช่วยพยุงเดิน, ชำนาญเส้นทาง รพ., เข็นวีลแชร์"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400">เพิ่มด่วน:</span>
                {['ช่วยพยุงเดิน', 'เข็นวีลแชร์', 'ชำนาญเส้นทาง รพ.', 'ปฐมพยาบาลเบื้องต้น', 'สื่อสารภาษาอังกฤษ'].map(
                  (skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkillTag(skill)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 border border-gray-200 transition cursor-pointer"
                    >
                      + {skill}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            /* LOCKED / GRAY STATE FOR SKILLS */
            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700">
              <div className="flex flex-wrap gap-2">
                {skillsText ? (
                  skillsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-xl bg-slate-200/90 text-slate-700 font-semibold border border-slate-300/70"
                      >
                        {skill}
                      </span>
                    ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    ยังไม่ได้ระบุทักษะ (กดไอคอนดินสอเพื่อแก้ไข)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 8. ROW: SERVICE AREAS (พื้นที่ให้บริการ) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>พื้นที่ให้บริการที่สะดวก (Service Areas)</span>
            </label>

            {!editAreas && (
              <button
                type="button"
                onClick={() => setEditAreas(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
          </div>

          {editAreas ? (
            /* ACTIVE EDITING STATE FOR SERVICE AREAS */
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-500/80 rounded-2xl space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                  แก้ไขพื้นที่ให้บริการ
                </span>
                <button
                  type="button"
                  onClick={() => setEditAreas(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  เสร็จสิ้น
                </button>
              </div>

              <input
                type="text"
                value={serviceAreasText}
                onChange={(e) => setServiceAreasText(e.target.value)}
                placeholder="เช่น พญาไท, บางกอกน้อย, ราชเทวี, จตุจักร"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400">เพิ่มด่วน:</span>
                {['พญาไท', 'บางกอกน้อย', 'ราชเทวี', 'จตุจักร', 'ปทุมวัน', 'สาทร', 'ลาดพร้าว'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => addAreaTag(area)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 border border-gray-200 transition cursor-pointer"
                  >
                    + {area}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* LOCKED / GRAY STATE FOR SERVICE AREAS */
            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700">
              <div className="flex flex-wrap gap-2">
                {serviceAreasText ? (
                  serviceAreasText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((area, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-xl bg-slate-200/90 text-slate-700 font-semibold border border-slate-300/70 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {area}
                      </span>
                    ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    ยังไม่ได้ระบุพื้นที่ (กดไอคอนดินสอเพื่อแก้ไข)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="p-3.5 bg-amber-50 border-2 border-amber-300/80 rounded-2xl flex items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>คุณมีการแก้ไขข้อมูลที่ยังไม่ได้บันทึก กรุณากดปุ่ม <strong>&quot;บันทึกการแก้ไขโปรไฟล์&quot;</strong> ด้านล่าง</span>
            </div>
          </div>
        )}

        {/* 9. BOTTOM ACTION BAR: SAVE & DELETE PROFILE */}
        <div className="pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
          {/* Delete Profile Button */}
          <button
            type="button"
            onClick={onDeleteProfile}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            ลบโปรไฟล์ผู้ช่วย
          </button>

          {/* Save Profile Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full sm:w-auto px-9 py-3.5 rounded-2xl text-white font-bold text-base transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-400/40 shadow-xl shadow-emerald-200 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-200'
            }`}
          >
            <Save className="w-5 h-5" />
            <span>
              {saving
                ? 'กำลังบันทึกข้อมูล...'
                : hasUnsavedChanges
                ? 'บันทึกการแก้ไขโปรไฟล์ (มีข้อมูลใหม่)'
                : 'บันทึกการแก้ไขโปรไฟล์'}
            </span>
          </button>
        </div>

      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        currentAvatarUrl={avatarUrl}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={(newUrl) => setAvatarUrl(newUrl)}
      />

      {/* Vehicle Manager Modal */}
      {isVehicleModalOpen && (
        <VehicleManagerModal
          key={editingVehicle ? `${editingVehicle.type}-${editingVehicle.plate}` : 'new-vehicle'}
          isOpen={isVehicleModalOpen}
          editingVehicle={editingVehicle}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
          onSave={handleSaveVehicle}
        />
      )}
    </form>
  );
}
