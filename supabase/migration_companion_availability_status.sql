-- ==========================================================
-- Migration: Companion Real-time Availability & Busy Status
-- ระบบแสดงสถานะ "ว่าง" / "ไม่ว่าง (ติดภารกิจกับลูกค้า)" ของผู้ช่วยแบบอัตโนมัติ
-- คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด "Run"
-- ==========================================================

-- 1. เพิ่มคอลัมน์ is_busy ในตาราง companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles 
ADD COLUMN IF NOT EXISTS is_busy BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companion_profiles_is_busy 
ON public.companion_profiles(is_busy);

-- 2. ฟังก์ชันและ Trigger ตรวจสอบสถานะงานที่กำลังดำเนินการ (Active Bookings)
-- เมื่อมีการรับงาน (accepted), เริ่มออกเดินทาง (in_progress), หรือจบงาน (completed/cancelled)
-- ระบบจะซิงก์สถานะ is_busy ให้กับผู้ช่วยคนนั้นโดยอัตโนมัติทันที
CREATE OR REPLACE FUNCTION public.sync_companion_busy_status()
RETURNS TRIGGER AS $$
DECLARE
  v_comp_id UUID;
  v_has_active BOOLEAN := false;
BEGIN
  -- หา companion_id จากแถวใหม่หรือแถวเดิม
  v_comp_id := COALESCE(NEW.companion_id, OLD.companion_id);

  IF v_comp_id IS NOT NULL THEN
    -- ตรวจสอบว่ายังมีงานที่สถานะเป็น 'in_progress' หรือ 'accepted' หรือไม่
    SELECT EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE companion_id = v_comp_id 
        AND status IN ('in_progress', 'accepted')
    ) INTO v_has_active;

    -- อัปเดตคอลัมน์ is_busy ใน companion_profiles
    UPDATE public.companion_profiles
    SET 
      is_busy = v_has_active,
      updated_at = NOW()
    WHERE id = v_comp_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ผูก Trigger เข้ากับตาราง bookings
DROP TRIGGER IF EXISTS trg_sync_companion_busy_status ON public.bookings;
CREATE TRIGGER trg_sync_companion_busy_status
AFTER INSERT OR UPDATE OF status, companion_id OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_companion_busy_status();

-- 4. คำนวณและปรับปรุงสถานะ is_busy เริ่มต้นสำหรับผู้ช่วยทุกคนในระบบปัจจุบัน
UPDATE public.companion_profiles c
SET is_busy = EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.companion_id = c.id 
    AND b.status IN ('in_progress', 'accepted')
);
