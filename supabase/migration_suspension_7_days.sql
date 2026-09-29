-- ==========================================================
-- Migration: Companion 7-Day Temporary Suspension & Auto-Unlock
-- ระบบระงับการให้บริการชั่วคราว 7 วัน และปลดระงับอัตโนมัติ
-- ==========================================================

-- 1. เพิ่มคอลัมน์ suspended_until ใน companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles 
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companion_profiles_suspended_until 
ON public.companion_profiles(suspended_until);

-- 2. ฟังก์ชันตรวจสอบและปลดระงับผู้ช่วยที่ครบกำหนดเวลาอัตโนมัติ (Database Helper Function)
CREATE OR REPLACE FUNCTION public.auto_unsuspend_expired_companions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.companion_profiles
  SET 
    is_suspended = false,
    is_available = true,
    suspension_reason = NULL,
    suspended_until = NULL,
    rating_avg = CASE WHEN rating_avg < 2.5 THEN 3.0 ELSE rating_avg END,
    updated_at = NOW()
  WHERE is_suspended = true
    AND suspended_until IS NOT NULL
    AND suspended_until <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
