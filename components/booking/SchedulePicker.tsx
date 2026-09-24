import React from "react";
import { Calendar, Clock } from "lucide-react";

interface SchedulePickerProps {
  appointmentDate: string;
  startTime: string;
  onAppointmentDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
}

export default function SchedulePicker({
  appointmentDate,
  startTime,
  onAppointmentDateChange,
  onStartTimeChange,
}: SchedulePickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-900">
        4. วันและเวลานัดหมาย <span className="text-rose-500">*</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            วันที่นัดหมาย
          </label>
          <input
            type="date"
            required
            value={appointmentDate}
            onChange={(e) => onAppointmentDateChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            เวลาเริ่มนัดหมาย
          </label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900"
          />
        </div>
      </div>
    </div>
  );
}
