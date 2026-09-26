-- ==========================================================
-- Migration: Fix profiles.role for unapproved/new users
-- ปรับสิทธิ์ (role) ของผู้ใช้ที่ยังไม่ได้รับการอนุมัติให้เป็น 'customer'
-- ==========================================================

-- 1. ปรับสิทธิ์ผู้ใช้ทั้งหมดที่มี role = 'companion' แต่ยังไม่ได้รับการอนุมัติ (verified) ใน companion_profiles ให้กลับเป็น 'customer'
UPDATE public.profiles
SET role = 'customer', updated_at = NOW()
WHERE role = 'companion'
  AND id NOT IN (
    SELECT id FROM public.companion_profiles WHERE verification_status = 'verified'
  );
