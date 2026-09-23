-- ==========================================================
-- CareCompanion Migration: Fix Rating for New Companions
-- คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด "Run" ได้ทันที
-- ==========================================================

-- 1. ปรับปรุงฟังก์ชันคำนวณคะแนนรีวิว: หากยังไม่มีรีวิว ให้ default เป็น 0.0 (ไม่ใช่ 5.0)
CREATE OR REPLACE FUNCTION public.update_companion_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.companion_profiles
  SET 
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE companion_id = COALESCE(NEW.companion_id, OLD.companion_id)
    ), 0.0),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE companion_id = COALESCE(NEW.companion_id, OLD.companion_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.companion_id, OLD.companion_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ปรับรีเซ็ตคะแนนรีวิวของผู้ช่วยที่ยังไม่มีรีวิว (rating_count = 0 หรือ NULL) ให้เป็น 0.0
UPDATE public.companion_profiles
SET 
  rating_avg = 0.0,
  rating_count = 0
WHERE rating_count = 0 OR rating_count IS NULL;
