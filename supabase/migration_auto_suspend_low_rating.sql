-- ==========================================================
-- Migration: Auto-suspend companion when rating_avg < 2.5
-- อัปเดตฟังก์ชันคำนวณคะแนนดาว ให้ระงับบัญชีผู้ช่วยอัตโนมัติหากคะแนนเฉลี่ยต่ำกว่า 2.5 ดาว
-- ==========================================================

CREATE OR REPLACE FUNCTION public.update_companion_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_companion_id UUID;
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  v_companion_id := COALESCE(NEW.companion_id, OLD.companion_id);

  SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE companion_id = v_companion_id;

  IF v_count > 0 AND v_avg < 2.5 THEN
    UPDATE public.companion_profiles
    SET 
      rating_avg = v_avg,
      rating_count = v_count,
      is_suspended = true,
      is_available = false,
      suspension_reason = COALESCE(suspension_reason, 'ถูกระงับบัญชีอัตโนมัติ เนื่องจากคะแนนดาวเฉลี่ยต่ำกว่า 2.5 ดาว (รอผู้ดูแลระบบตรวจสอบและพูดคุย)'),
      updated_at = NOW()
    WHERE id = v_companion_id;
  ELSE
    UPDATE public.companion_profiles
    SET 
      rating_avg = COALESCE(v_avg, 5.0),
      rating_count = COALESCE(v_count, 0),
      updated_at = NOW()
    WHERE id = v_companion_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_companion_rating ON public.reviews;
CREATE TRIGGER trg_update_companion_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_companion_rating();
