-- ==========================================================
-- Migration: Add DELETE Policies for Profiles and Companion Profiles
-- รองรับการลบ/เคลียร์ข้อมูลโปรไฟล์โดยเจ้าของบัญชีและแอดมิน
-- ==========================================================

-- 1. อนุญาตให้ผู้ใช้และแอดมินสามารถลบแถวข้อมูลใน public.profiles ได้
DROP POLICY IF EXISTS "Users and admins can delete profile" ON public.profiles;
CREATE POLICY "Users and admins can delete profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 2. อนุญาตให้ผู้ใช้และแอดมินสามารถลบแถวข้อมูลใน public.companion_profiles ได้
DROP POLICY IF EXISTS "Users can delete their own companion profile" ON public.companion_profiles;
DROP POLICY IF EXISTS "Users and admins can delete companion profile" ON public.companion_profiles;
CREATE POLICY "Users and admins can delete companion profile"
ON public.companion_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 3. ตรวจสอบให้แน่ใจว่า Realtime เปิดใช้งานกับตาราง profiles และ companion_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companion_profiles;
