import React from "react";
import { Calendar, Clock } from "lucide-react";

interface SchedulePickerProps {
  appointmentDate: string;
  startTime: string;
  onAppointmentDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
  hasDateError?: boolean;
  hasTimeError?: boolean;
}

export default function SchedulePicker({
  appointmentDate,
  startTime,
  onAppointmentDateChange,
  onStartTimeChange,
  hasDateError = false,
  hasTimeError = false,
}: SchedulePickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-900">
        5. วันและเวลานัดหมาย <span className="text-rose-500">*</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            วันที่นัดหมาย
          </label>
          <input
            id="appointment-date-input"
            type="date"
            required
            value={appointmentDate}
            onChange={(e) => onAppointmentDateChange(e.target.value)}
            className={`scroll-mt-24 w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 transition-all ${
              hasDateError
                ? "border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            }`}
          />
          {hasDateError && (
            <p className="text-xs text-rose-600 font-semibold mt-1">
              ⚠️ กรุณาระบุวันที่นัดหมาย
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            เวลาเริ่มนัดหมาย
          </label>
          <input
            id="start-time-input"
            type="time"
            required
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className={`scroll-mt-24 w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 transition-all ${
              hasTimeError
                ? "border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            }`}
          />
          {hasTimeError && (
            <p className="text-xs text-rose-600 font-semibold mt-1">
              ⚠️ กรุณาระบุเวลาเริ่มนัดหมาย
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
