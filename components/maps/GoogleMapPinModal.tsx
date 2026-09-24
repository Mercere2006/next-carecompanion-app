'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Search, X, Check, ExternalLink } from 'lucide-react';
import { searchThaiPlaces, ThaiPlace } from '@/lib/thaiPlaces';

interface GoogleMapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (placeName: string, lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
}

export default function GoogleMapPinModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress,
}: GoogleMapPinModalProps) {
  const DEFAULT_LAT = 13.7563;
  const DEFAULT_LNG = 100.5018;

  const [selectedName, setSelectedName] = useState(initialAddress || '');
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || DEFAULT_LAT);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || DEFAULT_LNG);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ThaiPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSelectPlace = (place: ThaiPlace) => {
    setSelectedName(place.name);
    setSelectedLat(place.lat);
    setSelectedLng(place.lng);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedName, selectedLat, selectedLng);
    onClose();
  };

  const googleMapsExternalUrl = 'https://www.google.com/maps/search/?api=1&query=' + selectedLat + ',' + selectedLng;
  const googleMapsEmbedUrl = 'https://maps.google.com/maps?q=' + selectedLat + ',' + selectedLng + '&hl=th&z=16&output=embed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5 fill-rose-500 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                ปักหมุดพิกัดบน Google Map
                <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                  จุดหมายปลายทาง
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                ค้นหาสถานที่ หรือเลือกพิกัดจุดหมายแล้วกดยืนยันเพื่อปักหมุด
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Search Box */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสถานที่ เช่น มหาวิทยาลัยสยาม, รพ.ศิริราช, สยามพารากอน..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm bg-white text-gray-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-20 max-h-60 overflow-y-auto space-y-1">
                <p className="px-2 py-1 text-gray-400 font-bold uppercase text-[10px]">
                  สถานที่แนะนำ ({suggestions.length}):
                </p>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 text-gray-800 transition flex items-start gap-2.5 cursor-pointer group"
                  >
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-rose-700 flex items-center justify-between">
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

          {/* Embedded Google Map Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100 h-80 sm:h-96">
            <iframe
              src={googleMapsEmbedUrl}
              title="Google Map Pin Preview"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Overlay Pin Indicator */}
            {selectedName && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-gray-800">
                  จุดหมุด: {selectedName}
                </span>
              </div>
            )}

            {/* External link button */}
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-gray-700 hover:text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 shadow-md flex items-center gap-1.5 transition"
            >
              เปิดใน Google Maps เต็มจอ
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
            disabled={!selectedName}
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            ยืนยันปักหมุดตำแหน่งนี้
          </button>
        </div>
      </div>
    </div>
  );
}