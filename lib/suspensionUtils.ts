import { createClient } from '@/lib/supabase/client';
import { addSystemNotification } from '@/lib/notifications';
import { formatThaiDate } from '@/lib/utils';

export const SUSPENSION_DURATION_DAYS = 7;

/**
 * Calculate the timestamp when the suspension will end (default 7 days from now)
 */
export function calculateSuspendedUntil(days = SUSPENSION_DURATION_DAYS): string {
  const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return target.toISOString();
}

/**
 * Extract suspended_until timestamp from companion profile (dedicated column or fallback embedded marker)
 */
export function extractSuspendedUntil(comp: {
  suspended_until?: string | null;
  suspension_reason?: string | null;
  updated_at?: string;
  is_suspended?: boolean;
}): string | null {
  if (comp.suspended_until) {
    return comp.suspended_until;
  }

  // Fallback 1: Extract from suspension_reason tag [SUSPENDED_UNTIL:ISO_STRING]
  if (comp.suspension_reason) {
    const match = comp.suspension_reason.match(/\[SUSPENDED_UNTIL:([^\]]+)\]/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback 2: If suspended and has updated_at, calculate updated_at + 7 days
  if (comp.is_suspended && comp.updated_at) {
    const baseDate = new Date(comp.updated_at);
    if (!isNaN(baseDate.getTime())) {
      return new Date(baseDate.getTime() + SUSPENSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  return null;
}

/**
 * Check if the suspension has expired
 */
export function isSuspensionExpired(suspendedUntil?: string | null): boolean {
  if (!suspendedUntil) return false;
  const target = new Date(suspendedUntil);
  if (isNaN(target.getTime())) return false;
  return new Date().getTime() >= target.getTime();
}

/**
 * Clean suspension reason for presentation by stripping metadata tags
 */
export function cleanSuspensionReason(reason?: string | null): string {
  if (!reason) return 'อยู่ระหว่างการตรวจสอบข้อร้องเรียนและการบริการ';
  return reason.replace(/\[SUSPENDED_UNTIL:[^\]]+\]/g, '').trim();
}

/**
 * Format the remaining suspension time into human-friendly Thai
 */
export function formatSuspensionRemaining(suspendedUntil: string): string {
  const target = new Date(suspendedUntil);
  if (isNaN(target.getTime())) return '';

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'ครบกำหนด 7 วันแล้ว (กำลังปลดระงับอัตโนมัติ)';
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const dateFormatted = formatThaiDate(suspendedUntil);
  const timeFormatted = target.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  let durationText = '';
  if (days > 0) {
    durationText = `อีก ${days} วัน ${hours > 0 ? `${hours} ชม.` : ''}`;
  } else if (hours > 0) {
    durationText = `อีก ${hours} ชม. ${minutes > 0 ? `${minutes} นาที` : ''}`;
  } else {
    durationText = `อีก ${minutes} นาที`;
  }

  return `เหลือเวลา${durationText} (ปลดระงับวันที่ ${dateFormatted} เวลา ${timeFormatted} น.)`;
}

/**
 * Automatically unsuspend a companion in the database and issue notification
 */
export async function autoUnsuspendCompanion(
  supabase: ReturnType<typeof createClient>,
  companionId: string,
  currentRatingAvg?: number
): Promise<boolean> {
  try {
    const updatePayload: Record<string, unknown> = {
      is_suspended: false,
      is_available: true,
      suspension_reason: null,
      suspended_until: null,
      updated_at: new Date().toISOString(),
    };

    if (currentRatingAvg !== undefined && Number(currentRatingAvg) < 2.5) {
      updatePayload.rating_avg = 3.0;
    }

    let { error } = await supabase
      .from('companion_profiles')
      .update(updatePayload)
      .eq('id', companionId);

    // If suspended_until column doesn't exist in Supabase schema cache yet, retry without it
    if (error && error.message?.includes('suspended_until')) {
      delete updatePayload.suspended_until;
      const retry = await supabase.from('companion_profiles').update(updatePayload).eq('id', companionId);
      error = retry.error;
    }

    if (error) {
      console.error('Error auto-unsuspending companion:', error);
      return false;
    }

    // Send notification to companion
    addSystemNotification(companionId, {
      id: `auto-unsusp-${Date.now()}`,
      type: 'account_unsuspended',
      title: '✅ สิ้นสุดระยะเวลาระงับ 7 วัน บัญชีของคุณได้รับการปลดระงับแล้ว 🎉',
      message:
        'ครบกำหนดระยะเวลาการระงับชั่วคราว 7 วันเรียบร้อยแล้ว ระบบได้ทำการปลดระงับบัญชีของคุณอัตโนมัติ คุณสามารถเปิดรับงานและให้บริการลูกค้าได้ตามปกติ',
      link: '/companion/dashboard',
    });

    return true;
  } catch (err) {
    console.error('Exception during auto-unsuspend:', err);
    return false;
  }
}
