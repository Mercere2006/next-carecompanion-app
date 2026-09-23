-- ==========================================================
-- Migration: Reports and Companion Suspension Management
-- เพิ่มตารางรายงานผู้ช่วย (reports) และระบบระงับ/ปลดระงับบัญชี (suspension)
-- ==========================================================

-- 1. เพิ่มคอลัมน์เกี่ยวกับการระงับและการตักเตือนใน companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_companion_profiles_is_suspended 
ON public.companion_profiles(is_suspended);

-- 2. สร้างตาราง reports สำหรับเก็บข้อร้องเรียนและรายงานผู้ช่วย
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_companion_id ON public.reports(companion_id);
CREATE INDEX IF NOT EXISTS idx_reports_customer_id ON public.reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 3. Row Level Security (RLS) สำหรับตาราง reports
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

-- 3.1 ลูกค้าสามารถส่งรายงานของตนเองได้
DROP POLICY IF EXISTS "Customers can create reports" ON public.reports;
CREATE POLICY "Customers can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- 3.2 ลูกค้าสามารถดูรายงานที่ตนเองส่งได้
DROP POLICY IF EXISTS "Customers can view their own reports" ON public.reports;
CREATE POLICY "Customers can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- 3.3 แอดมินสามารถดู แก้ไข และจัดการรายงานทั้งหมดได้
DROP POLICY IF EXISTS "Admins have full access to reports" ON public.reports;
CREATE POLICY "Admins have full access to reports"
ON public.reports FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. ฟังก์ชันและ Trigger อัปเดต rating_avg และ rating_count อัตโนมัติเมื่อมีรีวิวใหม่
CREATE OR REPLACE FUNCTION public.update_companion_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.companion_profiles
  SET 
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE companion_id = COALESCE(NEW.companion_id, OLD.companion_id)
    ), 5.0),
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

DROP TRIGGER IF EXISTS trg_update_companion_rating ON public.reviews;
CREATE TRIGGER trg_update_companion_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_companion_rating();
