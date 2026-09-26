'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  ExternalLink,
  Navigation,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { searchThaiPlaces, ThaiPlace } from '@/lib/thaiPlaces';

interface GoogleMapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (placeName: string, lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  title?: string;
  pinColor?: 'green' | 'red';
}

const QUICK_LANDMARKS = [
  {
    label: '🏥 รพ.ศิริราช',
    name: 'โรงพยาบาลศิริราช',
    address: '2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพมหานคร 10700',
    lat: 13.7588,
    lng: 100.4857,
  },
  {
    label: '🏥 รพ.จุฬาฯ',
    name: 'โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย',
    address: '1874 ถนนพระราม 4 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330',
    lat: 13.7323,
    lng: 100.5348,
  },
  {
    label: '🏥 รพ.รามาธิบดี',
    name: 'โรงพยาบาลรามาธิบดี',
    address: '270 ถนนพระราม 6 แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพมหานคร 10400',
    lat: 13.7663,
    lng: 100.5283,
  },
  {
    label: '🛍️ สยามพารากอน',
    name: 'สยามพารากอน (Siam Paragon)',
    address: '991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330',
    lat: 13.7460,
    lng: 100.5348,
  },
  {
    label: '🛍️ ไอคอนสยาม',
    name: 'ไอคอนสยาม (ICONSIAM)',
    address: '299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพมหานคร 10600',
    lat: 13.7267,
    lng: 100.5104,
  },
  {
    label: '🚆 สถานีกลางฯ',
    name: 'สถานีกลางกรุงเทพอภิวัฒน์ (บางซื่อ)',
    address: 'ถนนเทอดดำริ แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
    lat: 13.8037,
    lng: 100.5404,
  },
  {
    label: '✈️ สนามบินดอนเมือง',
    name: 'ท่าอากาศยานดอนเมือง (DMK)',
    address: '222 ถนนวิภาวดีรังสิต แขวงสนามบิน เขตดอนเมือง กรุงเทพมหานคร 10210',
    lat: 13.9126,
    lng: 100.6067,
  },
  {
    label: '✈️ สนามบินสุวรรณภูมิ',
    name: 'ท่าอากาศยานสุวรรณภูมิ (BKK)',
    address: '999 หมู่ 1 หนองปรือ อำเภอบางพลี จังหวัดสมุทรปราการ 10540',
    lat: 13.6900,
    lng: 100.7501,
  },
];

export default function GoogleMapPinModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress,
  title,
  pinColor = 'red',
}: GoogleMapPinModalProps) {
  const isGreen = pinColor === 'green';
  const DEFAULT_LAT = 13.7563;
  const DEFAULT_LNG = 100.5018;

  const [selectedName, setSelectedName] = useState(initialAddress || '');
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || DEFAULT_LAT);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || DEFAULT_LNG);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ThaiPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedName(initialAddress || '');
      setSelectedLat(initialLat || DEFAULT_LAT);
      setSelectedLng(initialLng || DEFAULT_LNG);
      setSearchQuery('');
      setSuggestions([]);
    }
  }, [isOpen, initialAddress, initialLat, initialLng]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const localMatches = searchThaiPlaces(searchQuery, 6);
    setSuggestions(localMatches);

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/geocode/search?q=' + encodeURIComponent(searchQuery.trim()));
          if (res.ok) {
            const data = await res.json();
            if (data?.results && Array.isArray(data.results)) {
              setSuggestions(data.results);
            }
          }
        } catch (err) {
          console.warn('Modal search error:', err);
        } finally {
          setIsSearching(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectPlace = (place: { name: string; lat: number; lng: number; address?: string }) => {
    setSelectedName(place.name);
    setSelectedLat(place.lat);
    setSelectedLng(place.lng);
    setSearchQuery('');
    setSuggestions([]);
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
        setSelectedLat(latitude);
        setSelectedLng(longitude);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              setSelectedName(data.address);
              setIsLocating(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Modal reverse geocoding error:', err);
        } finally {
          setIsLocating(false);
        }

        setSelectedName(`ตำแหน่งปัจจุบัน (${latitude}, ${longitude})`);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิดสิทธิ์ GPS หรือพิมพ์ค้นหาชื่อสถานที่');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedName.trim()) {
      alert('กรุณาเลือกสถานที่หรือปักหมุดตำแหน่งก่อนยืนยัน');
      return;
    }
    onConfirm(selectedName.trim(), selectedLat, selectedLng);
    onClose();
  };

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${selectedLat},${selectedLng}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${selectedLat},${selectedLng}&hl=th&z=16&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
                isGreen ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              <MapPin
                className={`w-5 h-5 ${
                  isGreen ? 'fill-emerald-500 text-emerald-600' : 'fill-rose-500 text-rose-600'
                }`}
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                ปักหมุดบนแผนที่ Google Maps
                <span
                  className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${
                    isGreen
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {title || (isGreen ? 'จุดรับผู้เดินทาง' : 'จุดหมายปลายทาง')}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                เลือกสถานที่ หรือระบุตำแหน่งพิกัด แล้วกดยืนยันเพื่อปักหมุดลงในแบบฟอร์ม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {/* 3-Step Simple Guide */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 text-xs text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
              <span><strong>ค้นหา</strong> หรือกดเลือกปุ่มด่วนด้านล่าง</span>
            </div>
            <span className="hidden sm:inline text-gray-300">→</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
              <span><strong>ตรวจดูหมุด</strong> บนแผนที่ด้านล่าง</span>
            </div>
            <span className="hidden sm:inline text-gray-300">→</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
              <span><strong>กดยืนยันปักหมุด</strong> ด้านล่างเพื่อนำไปใช้</span>
            </div>
          </div>

          {/* Search Box & Quick GPS */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อสถานที่ เช่น รพ.ศิริราช, สยามพารากอน, ซอยสุขุมวิท..."
                  className={`w-full pl-10 pr-9 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 text-sm bg-white text-gray-900 ${
                    isGreen
                      ? 'focus:ring-emerald-500 focus:border-emerald-500'
                      : 'focus:ring-rose-500 focus:border-rose-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-30 max-h-60 overflow-y-auto space-y-1">
                    <p className="px-2 py-1 text-gray-400 font-bold uppercase text-[10px]">
                      ผลการค้นหา ({suggestions.length}):
                    </p>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPlace(item)}
                        className={`w-full text-left p-2.5 rounded-xl text-gray-800 transition flex items-start gap-2.5 cursor-pointer group ${
                          isGreen ? 'hover:bg-emerald-50' : 'hover:bg-rose-50'
                        }`}
                      >
                        <MapPin
                          className={`w-4 h-4 shrink-0 mt-0.5 group-hover:scale-110 transition-transform ${
                            isGreen ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm font-bold text-gray-900 flex items-center justify-between ${
                              isGreen ? 'group-hover:text-emerald-700' : 'group-hover:text-rose-700'
                            }`}
                          >
                            <span>{item.name}</span>
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-gray-600">
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
              </div>

              {/* Instant GPS Button */}
              <button
                type="button"
                disabled={isLocating}
                onClick={handleUseCurrentLocation}
                className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-50"
                title="ปักหมุดที่ตำแหน่งปัจจุบันของคุณ"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>กำลังระบุ GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>พิกัด GPS ฉัน</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Landmark Chips */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>สถานที่ยอดนิยมที่พบบ่อย (แตะเพื่อปักหมุดทันที):</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_LANDMARKS.map((landmark, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPlace(landmark)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-gray-700 px-2.5 py-1 rounded-lg shrink-0 transition cursor-pointer border border-slate-200/70 hover:border-slate-300"
                  >
                    {landmark.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Pin Selection Box */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              isGreen
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isGreen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                <MapPin className="w-4 h-4 fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    ตำแหน่งที่ปักหมุดอยู่ขณะนี้:
                  </span>
                  <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded-md border border-gray-200 text-gray-600">
                    {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
                  </span>
                </div>
                <input
                  type="text"
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  placeholder="พิมพ์หรือปรับแต่งชื่อสถานที่ / จุดนัดพบ..."
                  className="mt-1 w-full bg-white px-2.5 py-1.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 คุณสามารถพิมพ์แก้ไขรายละเอียดเพิ่มเติม เช่น ประตูทางเข้า, อาคาร หรือจุดรอพบได้
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Google Map Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100 h-64 sm:h-80">
            <iframe
              src={googleMapsEmbedUrl}
              title="Google Map Pin Preview"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Overlay Pin Indicator */}
            {selectedName && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 pointer-events-none max-w-[70%]">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 ${
                    isGreen ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-bold text-gray-800 truncate">
                  📍 {selectedName}
                </span>
              </div>
            )}

            {/* External link button */}
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute bottom-3 right-3 bg-white/95 hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 shadow-md flex items-center gap-1.5 transition ${
                isGreen ? 'hover:text-emerald-700' : 'hover:text-rose-700'
              }`}
            >
              เปิด Google Maps เต็มจอ
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Helper caption */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>
              แผนที่ด้านบนแสดงจุดพิกัดจริงตามสถานที่ที่คุณเลือก เมื่อถูกต้องแล้วให้กดปุ่ม <strong>&quot;ยืนยันปักหมุดตำแหน่งนี้&quot;</strong>
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!selectedName.trim()}
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
              isGreen
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            <Check className="w-4 h-4" />
            ยืนยันปักหมุดตำแหน่งนี้
          </button>
        </div>
      </div>
    </div>
  );
}