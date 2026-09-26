-- ==========================================================
-- Migration: Fix Reports RLS & Realtime Permissions
-- แก้ไข RLS สำหรับตาราง reports และฟังก์ชันตรวจสอบสิทธิ์ Admin
-- ==========================================================

-- 1. มอบสิทธิ์การ execute ฟังก์ชัน is_admin ให้กับทุก role
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 2. อัปเดต RLS สำหรับตาราง reports ให้ Admin และ Customer สามารถเข้าถึงได้อย่างถูกต้อง 100%
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

-- 2.1 ลูกค้าสามารถส่งรายงาน (INSERT)
DROP POLICY IF EXISTS "Customers can create reports" ON public.reports;
CREATE POLICY "Customers can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id
);

-- 2.2 ลูกค้าสามารถดูรายงานที่ตนเองส่งได้ (SELECT)
DROP POLICY IF EXISTS "Customers can view their own reports" ON public.reports;
CREATE POLICY "Customers can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (
  auth.uid() = customer_id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2.3 แอดมินสามารถดู แก้ไข ลบ และจัดการรายงานทั้งหมดได้ (ALL)
DROP POLICY IF EXISTS "Admins have full access to reports" ON public.reports;
CREATE POLICY "Admins have full access to reports"
ON public.reports FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. เปิดใช้งาน Realtime publication สำหรับตาราง reports (เพื่อให้ Dashboard อัปเดตทันทีแบบเรียลไทม์)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  END IF;
END $$;
