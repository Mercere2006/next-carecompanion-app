'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  ExternalLink,
  Navigation,
  Loader2,
  Info,
  Move,
} from 'lucide-react';
import { searchThaiPlaces, ThaiPlace } from '@/lib/thaiPlaces';
import 'leaflet/dist/leaflet.css';

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
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const initLat = initialLat || DEFAULT_LAT;
      const initLng = initialLng || DEFAULT_LNG;
      setSelectedName(initialAddress || '');
      setSelectedLat(initLat);
      setSelectedLng(initLng);
      setSearchQuery('');
      setSuggestions([]);
    }
  }, [isOpen, initialAddress, initialLat, initialLng]);

  // Autocomplete search
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

  // Reverse geocode when pin moves (via drag or map click)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.address) {
          setSelectedName(data.address);
          return;
        }
      }
    } catch (err) {
      console.warn('Modal reverse geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }

    setSelectedName('ตำแหน่งที่ปักหมุด');
  };

  // Initialize interactive Leaflet map with draggable pin
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setupMap = async () => {
      // Dynamic import to ensure Leaflet only runs in browser
      const L = (await import('leaflet')).default || (await import('leaflet'));

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const targetLat = initialLat || DEFAULT_LAT;
      const targetLng = initialLng || DEFAULT_LNG;

      const map = L.map(mapContainerRef.current, {
        center: [targetLat, targetLng],
        zoom: 16,
        zoomControl: true,
      });

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const pinColorHex = isGreen ? '#10b981' : '#f43f5e';
      const pinFillHex = isGreen ? '#059669' : '#e11d48';

      // Custom animated SVG pin with pulsing shadow
      const customPinIcon = L.divIcon({
        className: 'care-draggable-pin',
        html: `
          <div style="position: relative; width: 42px; height: 52px; transform: translate(-21px, -52px); cursor: grab;" title="ลากเพื่อย้ายหมุด">
            <svg viewBox="0 0 384 512" width="42" height="52" style="filter: drop-shadow(0 6px 8px rgba(0,0,0,0.4));">
              <path fill="${pinFillHex}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
              <circle cx="192" cy="192" r="70" fill="#ffffff" />
              <circle cx="192" cy="192" r="42" fill="${pinColorHex}" />
            </svg>
            <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; border-radius: 50%; background: ${pinFillHex}; opacity: 0.8; box-shadow: 0 0 10px ${pinColorHex};"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Draggable marker
      const marker = L.marker([targetLat, targetLng], {
        draggable: true,
        icon: customPinIcon,
        autoPan: true,
      }).addTo(map);

      // Handle marker drag
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const lat = Number(pos.lat.toFixed(5));
        const lng = Number(pos.lng.toFixed(5));
        setSelectedLat(lat);
        setSelectedLng(lng);
        await reverseGeocode(lat, lng);
      });

      // Handle clicking anywhere on map to move pin
      map.on('click', async (e: any) => {
        const lat = Number(e.latlng.lat.toFixed(5));
        const lng = Number(e.latlng.lng.toFixed(5));
        marker.setLatLng([lat, lng]);
        setSelectedLat(lat);
        setSelectedLng(lng);
        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size to properly render tiles inside modal
      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    };

    setupMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlace = (place: { name: string; lat: number; lng: number; address?: string }) => {
    setSelectedName(place.name);
    setSelectedLat(place.lat);
    setSelectedLng(place.lng);
    setSearchQuery('');
    setSuggestions([]);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 16, { duration: 1.2 });
      markerRef.current.setLatLng([place.lat, place.lng]);
    }
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

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        await reverseGeocode(latitude, longitude);
        setIsLocating(false);
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
                ปักหมุดและเลื่อนตำแหน่งบนแผนที่
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
                สามารถคลิกหรือลากหมุดบนแผนที่ได้อย่างอิสระ แล้วกดยืนยันปักหมุด
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
          {/* Quick Notice: Interactive Drag & Move Pin */}
          <div className={`rounded-2xl p-3 text-xs flex items-center gap-2.5 border ${
            isGreen ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className={`p-1.5 rounded-xl shrink-0 ${isGreen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              <Move className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm">
                คุณสามารถคลิกหรือลากหมุดบนแผนที่เพื่อเปลี่ยนตำแหน่งได้ทันที
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                แตะจุดใดก็ได้บนแผนที่ หรือลากตัวหมุดไปยังหน้าบ้าน/จุดนัดพบที่ต้องการ ระบบจะค้นหาชื่อที่อยู่ให้อัตโนมัติ
              </p>
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
                  placeholder="ค้นหาสถานที่ เช่น รพ.ศิริราช, รพ.จุฬาฯ, สยามพารากอน, ซอยสุขุมวิท..."
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
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-[1000] max-h-60 overflow-y-auto space-y-1">
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    ตำแหน่งหมุดปัจจุบัน:
                    {isReverseGeocoding && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-normal">
                        <Loader2 className="w-3 h-3 animate-spin" /> กำลังค้นหาชื่อสถานที่...
                      </span>
                    )}
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
                  คุณสามารถพิมพ์แก้ไขรายละเอียดเพิ่มเติม เช่น ประตูทางเข้า, อาคาร หรือจุดรอพบได้
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100 h-64 sm:h-80">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Overlay Pin Indicator */}
            {selectedName && (
              <div className="absolute top-3 left-12 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 pointer-events-none max-w-[65%] z-20">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 ${
                    isGreen ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-bold text-gray-800 truncate">
                  {selectedName}
                </span>
              </div>
            )}

            {/* External link button */}
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute bottom-3 right-3 bg-white/95 hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 shadow-md flex items-center gap-1.5 transition z-20 ${
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
              <strong>คลิกบนแผนที่</strong> เพื่อย้ายหมุด หรือ <strong>กดค้างที่หมุดแล้วลาก</strong> ไปยังจุดที่ต้องการ จากนั้นกดปุ่ม <strong>&quot;ยืนยันปักหมุดตำแหน่งนี้&quot;</strong>
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