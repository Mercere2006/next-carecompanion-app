'use client';

import { useState } from 'react';
import { MapPin, Navigation, Loader2, Building2, X } from 'lucide-react';

interface LocationPickerProps {
  label: string;
  pinColor: 'green' | 'red';
  address: string;
  lat: number | null;
  lng: number | null;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  placeholder?: string;
  allowCurrentLocation?: boolean;
}

// Popular locations in Bangkok for quick-pick convenience during testing / demo
const POPULAR_LOCATIONS = [
  { name: 'โรงพยาบาลศิริราช ปิยมหาราชการุณย์', lat: 13.7578, lng: 100.4855 },
  { name: 'โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย (ตึก ภปร)', lat: 13.7314, lng: 100.5348 },
  { name: 'โรงพยาบาลรามาธิบดี พญาไท', lat: 13.7668, lng: 100.5284 },
  { name: 'ธนาคารกรุงเทพ สำนักงานใหญ่ สีลม', lat: 13.7278, lng: 100.5312 },
  { name: 'สำนักงานเขตจตุจักร', lat: 13.8268, lng: 100.5601 },
  { name: 'ตลาดนัดจตุจักร ประตู 1', lat: 13.7999, lng: 100.5501 },
];

export default function LocationPicker({
  label,
  pinColor,
  address,
  lat,
  lng,
  onAddressChange,
  onCoordinatesChange,
  placeholder = 'กรอกชื่อสถานที่หรือที่อยู่',
  allowCurrentLocation = false,
}: LocationPickerProps) {
  const [showQuickPick, setShowQuickPick] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleSelectQuickLocation = (loc: { name: string; lat: number; lng: number }) => {
    onAddressChange(loc.name);
    onCoordinatesChange(loc.lat, loc.lng);
    setShowQuickPick(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(5));
        const longitude = Number(position.coords.longitude.toFixed(5));
        onCoordinatesChange(latitude, longitude);

        try {
          // Fetch reverse geocoded Thai address
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              onAddressChange(data.address);
              setIsLocating(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding error:', err);
        } finally {
          setIsLocating(false);
        }

        // Fallback if reverse geocoding didn't return
        onAddressChange(`พิกัดปัจจุบัน (${latitude}, ${longitude})`);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาตรวจสอบการอนุญาตเข้าถึงตำแหน่ง (GPS) หรือพิมพ์ที่อยู่ด้วยตนเอง');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <span
            className={`w-3 h-3 rounded-full ${
              pinColor === 'green' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {label}
        </label>
        {allowCurrentLocation ? (
          <button
            type="button"
            disabled={isLocating}
            onClick={handleUseCurrentLocation}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60 flex items-center gap-1 transition cursor-pointer"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                กำลังระบุสถานที่...
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                ใช้ตำแหน่งปัจจุบัน
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowQuickPick((prev) => !prev)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            {showQuickPick ? 'ปิดสถานที่ยอดนิยม' : 'สถานที่ยอดนิยม'}
          </button>
        )}
      </div>

      <div className="relative">
        <MapPin
          className={`w-5 h-5 absolute left-3.5 top-3.5 ${
            pinColor === 'green' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        />
        <input
          type="text"
          required
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onFocus={() => setShowQuickPick(true)}
          placeholder={isLocating ? 'กำลังค้นหาชื่อสถานที่จาก GPS...' : placeholder}
          className={`w-full pl-11 ${
            address ? 'pr-10' : 'pr-4'
          } py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 ${
            pinColor === 'green'
              ? 'focus:ring-emerald-500 focus:border-emerald-500'
              : 'focus:ring-rose-500 focus:border-rose-500'
          } text-sm bg-white text-gray-900`}
        />
        {address && (
          <button
            type="button"
            onClick={() => onAddressChange('')}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            title="ล้างข้อความ"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Picks Dropdown for demo / easy selection */}
      {showQuickPick && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 text-xs space-y-1">
          <p className="px-2 py-1 text-gray-400 font-bold uppercase text-[10px]">
            จุดสำคัญยอดนิยม (คลิกเพื่อเลือกทันที):
          </p>
          {POPULAR_LOCATIONS.map((loc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickLocation(loc)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                pinColor === 'green'
                  ? 'hover:bg-emerald-50 hover:text-emerald-800'
                  : 'hover:bg-rose-50 hover:text-rose-800'
              } text-gray-700 transition flex items-center justify-between gap-2 min-w-0`}
            >
              <span className="truncate min-w-0 flex-1">{loc.name}</span>
              <span className="text-gray-400 text-[10px] shrink-0">
                {loc.lat}, {loc.lng}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowQuickPick(false)}
            className="w-full text-center py-1 text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            ปิดตัวเลือก
          </button>
        </div>
      )}

      {/* Lat/Lng indicator */}
      {lat && lng ? (
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 flex-wrap gap-1">
          <span>พิกัด GPS ปักหมุด:</span>
          <span className="font-mono text-emerald-700 font-medium">
            Lat: {lat}, Lng: {lng}
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-amber-600 italic px-1">
          *พิมพ์ชื่อสถานที่หรือเลือกจากจุดสำคัญเพื่อกำหนดพิกัด GPS
        </p>
      )}
    </div>
  );
}
