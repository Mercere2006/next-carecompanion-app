'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import GoogleMapPinModal from './GoogleMapPinModal';
import { searchThaiPlaces, POPULAR_THAI_PLACES, ThaiPlace } from '@/lib/thaiPlaces';

interface LocationPickerProps {
  id?: string;
  label: string;
  pinColor: 'green' | 'red';
  address: string;
  lat: number | null;
  lng: number | null;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  placeholder?: string;
  allowCurrentLocation?: boolean;
  disabled?: boolean;
  disabledNotice?: string;
  hasError?: boolean;
  errorMessage?: string;
}

export default function LocationPicker({
  id,
  label,
  pinColor,
  address,
  lat,
  lng,
  onAddressChange,
  onCoordinatesChange,
  placeholder = 'กรอกชื่อสถานที่หรือที่อยู่',
  allowCurrentLocation = false,
  disabled = false,
  disabledNotice,
  hasError = false,
  errorMessage,
}: LocationPickerProps) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<ThaiPlace[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete suggestions as user types
  useEffect(() => {
    const query = address.trim();
    if (!query) {
      // If focused and empty, suggest top popular places
      setSuggestions(POPULAR_THAI_PLACES.slice(0, 5));
      return;
    }

    // 1. Instant local search
    const localMatches = searchThaiPlaces(query, 6);
    setSuggestions(localMatches);

    // 2. Fetch server API if query is >= 2 chars
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/geocode/search?q=' + encodeURIComponent(query));
          if (res.ok) {
            const data = await res.json();
            if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
              setSuggestions(data.results);
            }
          }
        } catch (err) {
          console.warn('Geocode search error:', err);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [address]);

  const handleSelectPlace = (place: ThaiPlace) => {
    onAddressChange(place.name);
    onCoordinatesChange(place.lat, place.lng);
    setIsFocused(false);
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
    <div
      ref={containerRef}
      className={`space-y-2.5 p-4 rounded-2xl border transition relative flex flex-col justify-start ${
        disabled
          ? 'bg-gray-100/70 border-gray-200'
          : 'bg-slate-50/80 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-h-[26px] flex-wrap">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              disabled
                ? 'bg-gray-300'
                : pinColor === 'green'
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
            }`}
          />
          <span className="truncate">{label}</span>
        </label>
        {disabled ? (
          <span className="text-[11px] font-semibold bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            ไม่เปิดใช้งาน
          </span>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {allowCurrentLocation && (
              <>
                <button
                  type="button"
                  disabled={isLocating}
                  onClick={handleUseCurrentLocation}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline disabled:opacity-60 flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      กำลังระบุ...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      ใช้ตำแหน่งปัจจุบัน
                    </>
                  )}
                </button>
                <span className="text-gray-300 text-xs select-none">|</span>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className={`text-xs font-semibold hover:underline flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap ${
                pinColor === 'green'
                  ? 'text-emerald-700 hover:text-emerald-800'
                  : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              <MapPin
                className={`w-3.5 h-3.5 ${
                  pinColor === 'green' ? 'text-emerald-600' : 'text-rose-500'
                }`}
              />
              ปักหมุดบนแผนที่
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <MapPin
          className={`w-5 h-5 absolute left-3.5 top-3.5 ${
            disabled
              ? 'text-gray-400'
              : pinColor === 'green'
                ? 'text-emerald-600'
                : 'text-rose-600'
          }`}
        />
        <input
          id={id}
          type="text"
          disabled={disabled}
          required={!disabled}
          value={disabled ? '' : address}
          onChange={(e) => onAddressChange(e.target.value)}
          onFocus={() => {
            if (!disabled) setIsFocused(true);
          }}
          placeholder={
            disabled
              ? (disabledNotice || 'พบกันที่จุดหมาย (ช่องนี้ปิดการใช้งาน)')
              : isLocating
                ? 'กำลังค้นหาชื่อสถานที่จาก GPS...'
                : placeholder
          }
          className={`scroll-mt-24 w-full pl-11 ${
            !disabled && address ? 'pr-10' : 'pr-4'
          } py-3 rounded-xl border transition-all ${
            disabled
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : hasError
                ? 'border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900'
                : `border-gray-300 focus:outline-none focus:ring-2 ${
                    pinColor === 'green'
                      ? 'focus:ring-emerald-500 focus:border-emerald-500'
                      : 'focus:ring-rose-500 focus:border-rose-500'
                  } bg-white text-gray-900`
          } text-sm`}
        />
        {!disabled && address && (
          <button
            type="button"
            onClick={() => {
              onAddressChange('');
              setSuggestions([]);
            }}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            title="ล้างข้อความ"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!disabled && hasError && (
        <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1 animate-fadeIn">
          <span>⚠️ {errorMessage || 'กรุณาระบุสถานที่'}</span>
        </p>
      )}

      {disabled && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs">
          <span className="text-base">🚶</span>
          <span>{disabledNotice || 'คุณเลือกพบกันที่จุดหมายปลายทาง ช่องจุดรับผู้เดินทางนี้จึงไม่จำเป็นต้องระบุ'}</span>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {!disabled && isFocused && suggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 text-xs space-y-1 z-30 relative mt-1 max-h-64 overflow-y-auto">
          <p className="px-2 py-1 text-gray-400 font-bold uppercase text-[10px] flex items-center justify-between">
            <span>สถานที่แนะนำ ({suggestions.length}):</span>
            <span className="text-[9px] text-gray-400 font-normal">คลิกเพื่อเลือกทันที</span>
          </p>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectPlace(item);
              }}
              className={`w-full text-left p-2.5 rounded-xl ${
                pinColor === 'green'
                  ? 'hover:bg-emerald-50 text-gray-800'
                  : 'hover:bg-rose-50 text-gray-800'
              } transition flex items-start gap-2.5 cursor-pointer group`}
            >
              <MapPin
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  pinColor === 'green' ? 'text-emerald-500' : 'text-rose-500'
                } group-hover:scale-110 transition-transform`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 flex items-center justify-between gap-2">
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-gray-600 shrink-0">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {item.address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Google Map Pin Picker Modal */}
      <GoogleMapPinModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialAddress={address}
        initialLat={lat}
        initialLng={lng}
        title={label}
        pinColor={pinColor}
        onConfirm={(placeName, pLat, pLng) => {
          onAddressChange(placeName);
          onCoordinatesChange(pLat, pLng);
        }}
      />
    </div>
  );
}
