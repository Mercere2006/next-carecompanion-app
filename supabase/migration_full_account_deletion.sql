-- ==========================================================
-- CareCompanion: Complete Account & Data Deletion Migration
-- ระบบลบบัญชีผู้ใช้งานและข้อมูลทั้งหมดออกจากระบบอย่างสมบูรณ์
-- คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด "Run" ได้ทันที
-- ==========================================================

-- 1. ฟังก์ชัน admin_delete_user (SECURITY DEFINER)
-- ฟังก์ชันนี้ทำงานด้วยสิทธิ์ระดับสูงสุด (Superuser/Database Owner)
-- สามารถลบข้อมูลในตารางทั้งหมด และลบบัญชีผู้ใช้ใน auth.users ได้ในขั้นตอนเดียว
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_adm BOOLEAN := false;
  v_target_email TEXT := NULL;
  v_deleted_reviews INT := 0;
  v_deleted_reports INT := 0;
  v_deleted_bookings INT := 0;
  v_deleted_companion INT := 0;
  v_deleted_profile INT := 0;
  v_deleted_auth INT := 0;
BEGIN
  -- 1.1 ตรวจสอบสิทธิ์ว่าผู้เรียกเป็น Admin หรือไม่
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_caller AND role = 'admin'
  ) INTO v_is_adm;

  -- อนุญาตเฉพาะ Admin หรือเจ้าของบัญชีลบบัญชีตัวเอง
  IF NOT (v_is_adm OR v_caller = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ไม่มีสิทธิ์ในการลบบัญชีนี้ (ต้องเป็น Admin เท่านั้น)'
    );
  END IF;

  -- 1.2 ดึงข้อมูลอีเมลของผู้ใช้เพื่อบันทึกและส่งรายงานผล
  SELECT email INTO v_target_email FROM public.profiles WHERE id = target_user_id;
  IF v_target_email IS NULL THEN
    SELECT email INTO v_target_email FROM auth.users WHERE id = target_user_id;
  END IF;

  -- 1.3 ลบข้อมูลรีวิวที่เกี่ยวข้องทั้งหมด (ทั้งในฐานะลูกค้าและผู้ช่วย)
  DELETE FROM public.reviews 
  WHERE customer_id = target_user_id OR companion_id = target_user_id;
  GET DIAGNOSTICS v_deleted_reviews = ROW_COUNT;

  -- 1.4 ลบข้อมูลรายงานข้อร้องเรียนที่เกี่ยวข้องทั้งหมด
  DELETE FROM public.reports 
  WHERE customer_id = target_user_id OR companion_id = target_user_id;
  GET DIAGNOSTICS v_deleted_reports = ROW_COUNT;

  -- 1.5 ลบข้อมูลการจองที่เกี่ยวข้องทั้งหมด
  DELETE FROM public.bookings 
  WHERE customer_id = target_user_id OR companion_id = target_user_id;
  GET DIAGNOSTICS v_deleted_bookings = ROW_COUNT;

  -- 1.6 ลบโปรไฟล์ผู้ช่วย (companion_profiles)
  DELETE FROM public.companion_profiles 
  WHERE id = target_user_id;
  GET DIAGNOSTICS v_deleted_companion = ROW_COUNT;

  -- 1.7 ลบโปรไฟล์ผู้ใช้งาน (profiles)
  DELETE FROM public.profiles 
  WHERE id = target_user_id;
  GET DIAGNOSTICS v_deleted_profile = ROW_COUNT;

  -- 1.8 ลบบัญชีผู้ใช้งานออกจากระบบ Authentication ของ Supabase (auth.users)
  -- การลบใน auth.users จะทำการตัด Session, Token และลบ Identity การ Login ทั้งหมดออกทันที
  DELETE FROM auth.users 
  WHERE id = target_user_id;
  GET DIAGNOSTICS v_deleted_auth = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id,
    'email', v_target_email,
    'details', jsonb_build_object(
      'reviews', v_deleted_reviews,
      'reports', v_deleted_reports,
      'bookings', v_deleted_bookings,
      'companion_profile', v_deleted_companion,
      'profile', v_deleted_profile,
      'auth_user', v_deleted_auth
    ),
    'message', 'ลบบัญชีผู้ใช้และข้อมูลทั้งหมดออกจากระบบเรียบร้อยแล้ว'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ให้สิทธิ์ผู้ใช้ที่ผ่านการยืนยันตัวตน (Authenticated) สามารถเรียกใช้งาน RPC นี้ได้
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;


-- 2. กำหนด RLS DELETE Policies ให้ครอบคลุมสำหรับ Admin
-- เพื่อให้ Admin สามารถลบข้อมูลผ่าน Table Direct Deletion ได้เช่นกัน

-- 2.1 ตาราง profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users and admins can delete profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and owners can delete profile" ON public.profiles;
CREATE POLICY "Admins and owners can delete profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 2.2 ตาราง companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete their own companion profile" ON public.companion_profiles;
DROP POLICY IF EXISTS "Users and admins can delete companion profile" ON public.companion_profiles;
DROP POLICY IF EXISTS "Admins and owners can delete companion profile" ON public.companion_profiles;
CREATE POLICY "Admins and owners can delete companion profile"
ON public.companion_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 2.3 ตาราง bookings
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (public.is_admin() OR auth.uid() = customer_id OR auth.uid() = companion_id);

-- 2.4 ตาราง reports
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports"
ON public.reports FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2.5 ตาราง reviews
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (public.is_admin() OR auth.uid() = customer_id);


-- 3. ปรับปรุง Foreign Key Constraints ให้เป็น ON DELETE CASCADE
-- เพื่อป้องกันข้อผิดพลาด Foreign Key Constraint Violation เมื่อทำการลบแถวใน profiles

-- 3.1 companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles DROP CONSTRAINT IF EXISTS companion_profiles_id_fkey;
ALTER TABLE IF EXISTS public.companion_profiles 
  ADD CONSTRAINT companion_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3.2 bookings
ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE IF EXISTS public.bookings 
  ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_companion_id_fkey;
ALTER TABLE IF EXISTS public.bookings 
  ADD CONSTRAINT bookings_companion_id_fkey 
  FOREIGN KEY (companion_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3.3 reviews
ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE IF EXISTS public.reviews 
  ADD CONSTRAINT reviews_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_companion_id_fkey;
ALTER TABLE IF EXISTS public.reviews 
  ADD CONSTRAINT reviews_companion_id_fkey 
  FOREIGN KEY (companion_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3.4 reports
ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_customer_id_fkey;
ALTER TABLE IF EXISTS public.reports 
  ADD CONSTRAINT reports_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_companion_id_fkey;
ALTER TABLE IF EXISTS public.reports 
  ADD CONSTRAINT reports_companion_id_fkey 
  FOREIGN KEY (companion_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
