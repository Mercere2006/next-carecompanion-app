import { extractCleanBio } from './vehicleUtils';

/**
 * Checks if a companion is available on a specific date and time based on their available_schedule.
 * e.g., "จันทร์ - ศุกร์ (08:00 - 17:00 น.)", "ทุกวัน (07:00 - 16:00 น.)", "จันทร์ - เสาร์ (09:00 - 18:00 น.)"
 *
 * @param availableScheduleRaw - The raw string from companion_profiles.available_schedule
 * @param bio - Fallback bio string which may contain [SCHEDULE: ...]
 * @param appointmentDate - YYYY-MM-DD
 * @param startTime - HH:mm or HH:mm:ss
 */
export function isCompanionAvailableAt(
  availableScheduleRaw?: string | null,
  bio?: string | null,
  appointmentDate?: string | null,
  startTime?: string | null
): boolean {
  const schedule = availableScheduleRaw || (bio ? extractCleanBio(bio).embeddedSchedule : null);

  // If companion has not specified any schedule, default to available
  if (!schedule || !schedule.trim()) {
    return true;
  }

  const schedLower = schedule.toLowerCase();

  // 1. Day of Week Check
  if (appointmentDate) {
    const parts = appointmentDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const [y, m, d] = parts;
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      const isEveryday = schedLower.includes('ทุกวัน');

      if (!isEveryday) {
        // Map Thai days to numbers (Sunday = 0, Monday = 1, ...)
        const daysMap: Record<string, number> = {
          อาทิตย์: 0,
          จันทร์: 1,
          อังคาร: 2,
          พุธ: 3,
          พฤหัส: 4,
          พฤหัสบดี: 4,
          ศุกร์: 5,
          เสาร์: 6,
        };

        // Check range like "จันทร์ - ศุกร์" or "จันทร์ - เสาร์" or "อังคาร - อาทิตย์"
        const rangeMatch = schedLower.match(
          /(จันทร์|อังคาร|พุธ|พฤหัส(?:บดี)?|ศุกร์|เสาร์|อาทิตย์)\s*[-–—]\s*(จันทร์|อังคาร|พุธ|พฤหัส(?:บดี)?|ศุกร์|เสาร์|อาทิตย์)/
        );

        if (rangeMatch) {
          const startNum = daysMap[rangeMatch[1]];
          const endNum = daysMap[rangeMatch[2]];

          if (startNum !== undefined && endNum !== undefined) {
            let matchesDay = false;
            if (startNum <= endNum) {
              matchesDay = dayOfWeek >= startNum && dayOfWeek <= endNum;
            } else {
              // Wraps around Sunday (e.g. อังคาร (2) - อาทิตย์ (0))
              matchesDay = dayOfWeek >= startNum || dayOfWeek <= endNum;
            }
            if (!matchesDay) return false;
          }
        } else {
          // Check if specific day is mentioned
          const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
          const targetDayName = dayNames[dayOfWeek];
          if (!schedLower.includes(targetDayName)) {
            return false;
          }
        }
      }
    }
  }

  // 2. Time Range Check
  if (startTime) {
    const timeMatch = schedule.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      const startH = parseInt(timeMatch[1], 10);
      const startM = parseInt(timeMatch[2], 10);
      const endH = parseInt(timeMatch[3], 10);
      const endM = parseInt(timeMatch[4], 10);

      const [targetHStr, targetMStr] = startTime.split(':');
      const targetH = parseInt(targetHStr, 10);
      const targetM = parseInt(targetMStr || '0', 10);

      if (!isNaN(targetH) && !isNaN(targetM)) {
        const targetMinutes = targetH * 60 + targetM;
        const schedStartMinutes = startH * 60 + startM;
        const schedEndMinutes = endH * 60 + endM;

        if (targetMinutes < schedStartMinutes || targetMinutes > schedEndMinutes) {
          return false;
        }
      }
    }
  }

  return true;
}
