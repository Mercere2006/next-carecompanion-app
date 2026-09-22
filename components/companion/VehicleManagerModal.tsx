'use client';

import { useState } from 'react';
import { Car, Bike, X, Check, Plus, AlertCircle } from 'lucide-react';
import { VehicleEntry } from '@/lib/vehicleUtils';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: VehicleEntry) => void;
  editingVehicle?: VehicleEntry | null;
}

export default function VehicleManagerModal({
  isOpen,
  onClose,
  onSave,
  editingVehicle,
}: VehicleManagerModalProps) {
  const [type, setType] = useState<'car' | 'motorcycle'>(editingVehicle?.type || 'car');
  const [model, setModel] = useState(editingVehicle?.model || '');
  const [plate, setPlate] = useState(editingVehicle?.plate || '');
  const [rate, setRate] = useState(editingVehicle?.rate || (editingVehicle?.type === 'car' ? 350 : 280));
  const [errorMsg, setErrorMsg] = useState('');

  // When switching type, update default rate recommendation
  const handleTypeChange = (newType: 'car' | 'motorcycle') => {
    setType(newType);
    if (!editingVehicle) {
      setRate(newType === 'car' ? 350 : 250);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!model.trim()) {
      setErrorMsg('กรุณากรอกยี่ห้อ รุ่น และสีของยานพาหนะ');
      return;
    }

    if (!plate.trim()) {
      setErrorMsg('กรุณากรอกหมายเลขทะเบียนรถ');
      return;
    }

    if (!rate || rate < 50) {
      setErrorMsg('กรุณาระบุอัตราค่าบริการที่ถูกต้อง (ขั้นต่ำ 50 บาท/ชม.)');
      return;
    }

    const vehicleData: VehicleEntry = {
      id: editingVehicle?.id || `veh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      model: model.trim(),
      plate: plate.trim(),
      rate: Number(rate),
    };

    onSave(vehicleData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-gray-950 flex items-center gap-2">
            {editingVehicle ? '✏️ แก้ไขข้อมูลยานพาหนะ' : '➕ เพิ่มยานพาหนะใหม่'}
          </h3>
          <p className="text-xs text-gray-500">
            ระบุประเภทยานพาหนะ ยี่ห้อ รุ่น ทะเบียน และอัตราค่าบริการของคุณ
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vehicle Type Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              1. ประเภทยานพาหนะ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('car')}
                className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-center gap-2.5 cursor-pointer ${
                  type === 'car'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 font-medium'
                }`}
              >
                <Car className={`w-5 h-5 ${type === 'car' ? 'text-emerald-700' : 'text-gray-500'}`} />
                <span>🚗 รถยนต์ส่วนตัว</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('motorcycle')}
                className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-center gap-2.5 cursor-pointer ${
                  type === 'motorcycle'
                    ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 font-medium'
                }`}
              >
                <Bike className={`w-5 h-5 ${type === 'motorcycle' ? 'text-teal-700' : 'text-gray-500'}`} />
                <span>🛵 รถมอเตอร์ไซค์</span>
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              2. ยี่ห้อ / รุ่น / สี <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={type === 'car' ? 'เช่น Toyota Corolla Altis สีขาว' : 'เช่น Honda Click 160 สีดำ'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* License Plate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                3. หมายเลขทะเบียนรถ <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">
                (ซ่อนจากบุคคลทั่วไป แสดงเฉพาะผู้ล็อกอิน/ผู้จอง)
              </span>
            </div>
            <input
              type="text"
              required
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="เช่น 1กข 1234 กรุงเทพมหานคร"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                4. อัตราค่าบริการสำหรับยานพาหนะนี้ (บาท/ชม.) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-emerald-700">฿{rate} / ชั่วโมง</span>
            </div>
            <input
              type="number"
              min="50"
              max="2000"
              step="10"
              required
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            {/* Quick rate presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-gray-400">เรตแนะนำ:</span>
              {[200, 250, 300, 350, 400].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRate(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                    rate === preset
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  ฿{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {editingVehicle ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingVehicle ? 'บันทึกการแก้ไข' : 'เพิ่มยานพาหนะ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
