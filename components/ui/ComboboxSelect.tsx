'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Edit3 } from 'lucide-react';

export interface ComboboxOption {
  label: string;
  value: string;
  badge?: string;
  description?: string;
}

interface ComboboxSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  allOptionLabel?: string;
  className?: string;
}

export default function ComboboxSelect({
  value,
  onChange,
  options,
  placeholder = 'เลือก หรือพิมพ์เอง...',
  allOptionLabel,
  className = '',
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Handle option click
  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  // Check if current value matches one of the preset options
  const isExactPreset = options.some(
    (o) => o.value === value || o.label === value
  );
  const isCustomText = Boolean(value.trim()) && !isExactPreset;

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${isOpen ? 'z-30' : 'z-10'} ${className}`}>
      {/* Input Field with Dropdown Arrow and Clear Button */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'Enter') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all shadow-2xs hover:border-gray-400 truncate"
        />

        {/* Right side controls: Clear (X) + Dropdown Toggle Chevron */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                inputRef.current?.focus();
              }}
              title="ล้างข้อมูล"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            title={isOpen ? 'ปิดรายการ' : 'ดูตัวเลือก'}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Options Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-1.5 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Custom text indicator if user typed something not in presets */}
          {isCustomText && (
            <div className="px-3 py-2 bg-emerald-50/70 text-emerald-900 flex items-center justify-between gap-2 border-b border-emerald-100">
              <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold">
                <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  ข้อความที่คุณระบุเอง: <strong>&ldquo;{value}&rdquo;</strong>
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                พิมพ์เอง
              </span>
            </div>
          )}

          {/* All / Default option */}
          {allOptionLabel && (
            <div className="p-1">
              <button
                type="button"
                onClick={() => handleSelectOption('')}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition flex items-center justify-between cursor-pointer ${
                  !value
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <span>{allOptionLabel}</span>
                {!value && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            </div>
          )}

          {/* Preset Options */}
          <div className="p-1 space-y-0.5">
            <div className="px-2.5 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              ตัวเลือกแนะนำ
            </div>
            {options.map((opt) => {
              const isSelected = value === opt.value || value === opt.label;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-gray-700 hover:bg-emerald-50/50 hover:text-gray-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.badge && (
                      <span className="text-base shrink-0 select-none">
                        {opt.badge}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Hint */}
          <div className="px-3 py-2 bg-slate-50 text-[11px] text-gray-500 flex items-center gap-1.5">
            <Edit3 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>หรือพิมพ์ความต้องการของคุณลงในช่องได้โดยตรง</span>
          </div>
        </div>
      )}
    </div>
  );
}
