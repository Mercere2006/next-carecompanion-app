import { SupabaseClient } from '@supabase/supabase-js';

export type AvailabilityState = 'available' | 'busy' | 'suspended' | 'unavailable';

export interface AvailabilityInfo {
  state: AvailabilityState;
  isAvailable: boolean;
  isBusy: boolean;
  isSuspended: boolean;
  activeBookingStatus?: 'in_progress' | 'accepted' | null;
  badgeLabel: string;
  badgeShortLabel: string;
  badgeColor: string;
  dotColor: string;
  canBook: boolean;
  blockReason?: string;
}

/**
 * คำนวณและส่งคืนข้อมูลสถานะความพร้อมของผู้ช่วย (ว่าง / ไม่ว่าง / ถูกระงับ)
 */
export function getCompanionAvailabilityInfo(params: {
  isSuspended?: boolean;
  isBusy?: boolean;
  isAvailable?: boolean;
  activeBookingStatus?: 'in_progress' | 'accepted' | string | null;
}): AvailabilityInfo {
  const { isSuspended = false, isBusy = false, isAvailable = true, activeBookingStatus = null } = params;

  // 1. กรณีถูกระงับบัญชี
  if (isSuspended) {
    return {
      state: 'suspended',
      isAvailable: false,
      isBusy: false,
      isSuspended: true,
      activeBookingStatus: null,
      badgeLabel: 'ระงับการให้บริการชั่วคราว',
      badgeShortLabel: 'ระงับชั่วคราว',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      canBook: false,
      blockReason: 'ผู้ช่วยท่านนี้อยู่ระหว่างการตรวจสอบและถูกระงับการให้บริการชั่วคราว',
    };
  }

  // 2. กรณีติดภารกิจกับลูกค้าคนอื่นอยู่ (ไม่ว่าง)
  if (isBusy || activeBookingStatus === 'in_progress' || activeBookingStatus === 'accepted') {
    const isOngoing = activeBookingStatus === 'in_progress';
    return {
      state: 'busy',
      isAvailable: false,
      isBusy: true,
      isSuspended: false,
      activeBookingStatus: (activeBookingStatus as 'in_progress' | 'accepted') || 'in_progress',
      badgeLabel: isOngoing ? 'ไม่ว่าง (กำลังปฏิบัติภารกิจ)' : 'ไม่ว่าง (ติดลูกค้านัดหมาย)',
      badgeShortLabel: 'ไม่ว่าง (ติดภารกิจ)',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      canBook: false,
      blockReason: 'ผู้ช่วยท่านนี้กำลังติดภารกิจดูแลลูกค้าท่านอื่นอยู่ ณ ขณะนี้ จะกลับมาพร้อมรับงานใหม่อัตโนมัติเมื่อเสร็จสิ้นภารกิจ',
    };
  }

  // 3. กรณีปิดรับงานชั่วคราว
  if (!isAvailable) {
    return {
      state: 'unavailable',
      isAvailable: false,
      isBusy: false,
      isSuspended: false,
      activeBookingStatus: null,
      badgeLabel: 'พักรับงานชั่วคราว',
      badgeShortLabel: 'พักรับงาน',
      badgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
      dotColor: 'bg-gray-400',
      canBook: false,
      blockReason: 'ผู้ช่วยท่านนี้ปิดรับงานชั่วคราวในขณะนี้',
    };
  }

  // 4. กรณีว่างและพร้อมรับงานปกติ
  return {
    state: 'available',
    isAvailable: true,
    isBusy: false,
    isSuspended: false,
    activeBookingStatus: null,
    badgeLabel: 'ว่าง (พร้อมให้บริการ)',
    badgeShortLabel: 'ว่างตอนนี้',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    canBook: true,
  };
}

/**
 * ดึงรายการงานที่กำลังดำเนินการ (active bookings: 'in_progress' หรือ 'accepted') จาก Supabase
 * เพื่อระบุว่า Companion คนใดบ้างที่กำลัง "ติดลูกค้าอยู่" ณ ขณะนั้น
 */
export async function fetchActiveCompanionBookingsMap(
  supabase: SupabaseClient,
  companionIds?: string[]
): Promise<Map<string, 'in_progress' | 'accepted'>> {
  const busyMap = new Map<string, 'in_progress' | 'accepted'>();

  try {
    let query = supabase
      .from('bookings')
      .select('id, companion_id, status')
      .in('status', ['in_progress', 'accepted']);

    if (companionIds && companionIds.length > 0) {
      query = query.in('companion_id', companionIds);
    }

    const { data, error } = await query;

    if (!error && data) {
      for (const item of data) {
        // ให้สิทธิ์ความสำคัญ 'in_progress' มากกว่า 'accepted'
        const current = busyMap.get(item.companion_id);
        if (!current || item.status === 'in_progress') {
          busyMap.set(item.companion_id, item.status as 'in_progress' | 'accepted');
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching active companion bookings map:', err);
  }

  return busyMap;
}

/**
 * ตรวจสอบว่า Companion คนเดียวนี้กำลังติดภารกิจอยู่หรือไม่
 */
export async function checkIsCompanionBusy(
  supabase: SupabaseClient,
  companionId: string
): Promise<{ isBusy: boolean; activeStatus?: 'in_progress' | 'accepted' | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('companion_id', companionId)
      .in('status', ['in_progress', 'accepted'])
      .order('status', { ascending: false }) // 'in_progress' ก่อน 'accepted'
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        isBusy: true,
        activeStatus: data.status as 'in_progress' | 'accepted',
      };
    }
  } catch (err) {
    console.warn('Error checking companion busy state:', err);
  }

  return { isBusy: false, activeStatus: null };
}
