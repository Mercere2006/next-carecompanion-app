-- ==========================================================
-- CareCompanion Complete Setup & Seed SQL (Fixed)
-- คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด "Run" ได้ทันที
-- ==========================================================

-- 1. ปลดล็อค Foreign Key profiles_id_fkey เพื่อให้สามารถบันทึกผู้ช่วยตัวอย่าง (Mock Companions) ลงในระบบได้
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. ตรวจสอบคอลัมน์ยานพาหนะในตาราง companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles 
ADD COLUMN IF NOT EXISTS available_schedule TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;

CREATE INDEX IF NOT EXISTS idx_companion_profiles_vehicle_type ON public.companion_profiles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_companion_profiles_is_available ON public.companion_profiles(is_available);

-- 3. เติมข้อมูล Service Categories (หมวดหมู่บริการ 1 - 5)
CREATE TABLE IF NOT EXISTS public.service_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO public.service_categories (id, name, description, is_active)
VALUES
  (1, 'พบแพทย์ / ไปโรงพยาบาล', 'พาไปตรวจสุขภาพ พบแพทย์ตามนัด รอรับยา', true),
  (2, 'ติดต่อธนาคาร / การเงิน', 'พาไปทำธุรกรรมการเงิน ติดต่อสาขาธนาคาร', true),
  (3, 'ติดต่อหน่วยงานราชการ', 'พาไปติดต่อราชการ ทำบัตรประชาชน พาสปอร์ต', true),
  (4, 'ซื้อสินค้า / จ่ายตลาด', 'พาไปจ่ายตลาด ห้างสรรพสินค้า ซื้อของใช้', true),
  (5, 'ธุระทั่วไป', 'ช่วยอำนวยความสะดวกเรื่องทั่วไปตามนัดหมาย', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 4. เพิ่มข้อมูล Profiles ของผู้ช่วยตัวอย่าง (คุณสมชาย, คุณวิภาดา, คุณกิตติศักดิ์, คุณธนพร)
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, role, updated_at)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'somchai.care@example.com',
    'คุณสมชาย ใจดี',
    '081-234-5678',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'companion',
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'vipada.care@example.com',
    'คุณวิภาดา ศรีสุข',
    '089-876-5432',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    'companion',
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'kittisak.care@example.com',
    'คุณกิตติศักดิ์ มั่งคั่ง',
    '086-555-4321',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'companion',
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'thanaporn.care@example.com',
    'คุณธนพร รัตนศิลป์',
    '092-333-8899',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'companion',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 5. เพิ่มข้อมูล Companion Profiles พร้อมยานพาหนะ
INSERT INTO public.companion_profiles (
  id,
  bio,
  experience_years,
  skills,
  service_areas,
  available_schedule,
  hourly_rate,
  verification_status,
  rating_avg,
  rating_count,
  is_available,
  phone_verified,
  vehicle_type,
  vehicle_model,
  vehicle_plate,
  updated_at
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'อดีตบุรุษพยาบาลเกษียณ ใจเย็น มีประสบการณ์ดูแลผู้สูงอายุและผู้ป่วยพักฟื้นกว่า 8 ปี มีรถยนต์ส่วนตัวพร้อมอำนวยความสะดวก รับส่งไปโรงพยาบาลและรอรับยา',
    8,
    ARRAY['ดูแลผู้สูงอายุ', 'พาไปโรงพยาบาล', 'ช่วยพยุงเดิน', 'มีรถยนต์ส่วนตัว', 'ปฐมพยาบาลเบื้องต้น'],
    ARRAY['บางกอกน้อย', 'พญาไท', 'ศิริราช', 'ราชวิถี', 'ธนบุรี'],
    'จันทร์ - ศุกร์ (08:00 - 17:00 น.)',
    350,
    'verified',
    4.9,
    32,
    true,
    true,
    'car',
    'Toyota Corolla Altis สีบรอนซ์เงิน',
    '4กข 1234 กทม.',
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'พยาบาลวิชาชีพพาร์ทไทม์ ชำนาญการพาผู้สูงอายุไปพบแพทย์ที่ รพ.จุฬาฯ รพ.รามาฯ รพ.ศิริราช สื่อสารภาษาอังกฤษคล่องแคล่ว ช่วยพยุงและเข็นวีลแชร์ได้อย่างถูกต้องตามหลักสรีรศาสตร์',
    5,
    ARRAY['พยาบาลวิชาชีพ', 'สื่อสารภาษาอังกฤษ', 'ใช้วีลแชร์ / เข็นรถ', 'ช่วยพยุงเดิน', 'พาไปโรงพยาบาล'],
    ARRAY['ปทุมวัน', 'สีลม', 'สาทร', 'พญาไท', 'สุขุมวิท'],
    'ทุกวัน (07:00 - 16:00 น.)',
    300,
    'verified',
    5.0,
    46,
    true,
    true,
    'none',
    NULL,
    NULL,
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'บริการขับรถยนต์ส่วนตัวและพาส่งทำธุรกรรมธนาคาร ติดต่อหน่วยงานราชการ ทำพาสปอร์ต บัตรประชาชน ชำนาญเส้นทางในกรุงเทพฯ และปริมณฑล ช่วยยกสัมภาระและพาจ่ายตลาด',
    6,
    ARRAY['มีรถยนต์ส่วนตัว', 'ติดต่อหน่วยงานราชการ', 'ติดต่อธนาคาร / การเงิน', 'ซื้อสินค้า / จ่ายตลาด', 'ยกสัมภาระ'],
    ARRAY['จตุจักร', 'ลาดพร้าว', 'บางซื่อ', 'ดอนเมือง', 'นนทบุรี'],
    'จันทร์ - เสาร์ (09:00 - 18:00 น.)',
    380,
    'verified',
    4.8,
    24,
    true,
    true,
    'car',
    'Honda Civic สีขาว',
    '7กง 5678 กทม.',
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'ผู้ช่วยรุ่นใหม่ อารมณ์ดี มีความอดทนสูง มีมอเตอร์ไซค์ส่วนตัว คล่องตัวในเขตเมือง พาไปซื้อของ จ่ายตลาด รับยาแทน หรือติดต่อธุระด่วนนอกบ้านได้อย่างรวดเร็ว',
    3,
    ARRAY['ซื้อสินค้า / จ่ายตลาด', 'รับยาแทน', 'ธุระทั่วไป', 'มีมอเตอร์ไซค์ส่วนตัว', 'คล่องตัว'],
    ARRAY['สยาม', 'พระราม 9', 'รัชดา', 'ห้วยขวาง', 'ดินแดง'],
    'อังคาร - อาทิตย์ (10:00 - 19:00 น.)',
    220,
    'verified',
    4.9,
    38,
    true,
    true,
    'motorcycle',
    'Honda Click 160 สีดำ',
    '2ขข 9876 กทม.',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  hourly_rate = EXCLUDED.hourly_rate,
  vehicle_type = EXCLUDED.vehicle_type,
  vehicle_model = EXCLUDED.vehicle_model,
  vehicle_plate = EXCLUDED.vehicle_plate,
  updated_at = NOW();

-- 6. กำหนดค่าเริ่มต้น is_available ให้เป็น false (ยังไม่แสดงจนกว่าจะยืนยันตัวตนและกรอกข้อมูลครบถ้วน)
ALTER TABLE IF EXISTS public.companion_profiles 
ALTER COLUMN is_available SET DEFAULT false;

-- ซ่อนโปรไฟล์ companion ที่ยังกรอกข้อมูลไม่ครบถ้วน หรือยังไม่ได้ยืนยันตัวตน (เช่น ยังไม่ผ่านการสแกนใบหน้า/OTP หรือยังไม่มีเรทราคา/คำแนะนำตัว)
UPDATE public.companion_profiles 
SET is_available = false 
WHERE 
  verification_status != 'verified'
  OR hourly_rate IS NULL 
  OR hourly_rate <= 0 
  OR bio IS NULL 
  OR TRIM(bio) = '';

-- 7. กำหนดตาราง reviews (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  companion_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. กำหนด Row Level Security (RLS) ทั้งระบบ (เพื่อให้ทุกคนเข้าถึงข้อมูลสาธารณะและใช้งานได้ 100%)

-- 8.1 ตาราง profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 8.2 ตาราง companion_profiles
ALTER TABLE IF EXISTS public.companion_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public companion profiles are viewable by everyone" ON public.companion_profiles;
CREATE POLICY "Public companion profiles are viewable by everyone"
ON public.companion_profiles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own companion profile" ON public.companion_profiles;
CREATE POLICY "Users can insert their own companion profile"
ON public.companion_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own companion profile" ON public.companion_profiles;
CREATE POLICY "Users can update their own companion profile"
ON public.companion_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own companion profile" ON public.companion_profiles;
CREATE POLICY "Users can delete their own companion profile"
ON public.companion_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 8.3 ตาราง service_categories
ALTER TABLE IF EXISTS public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service categories are viewable by everyone" ON public.service_categories;
CREATE POLICY "Service categories are viewable by everyone"
ON public.service_categories FOR SELECT
TO anon, authenticated
USING (true);

-- 8.4 ตาราง reviews
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Customers can insert reviews" ON public.reviews;
CREATE POLICY "Customers can insert reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- 8.5 ตาราง bookings
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert their own bookings" ON public.bookings;
CREATE POLICY "Customers can insert their own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can view their related bookings" ON public.bookings;
CREATE POLICY "Users can view their related bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = companion_id);

DROP POLICY IF EXISTS "Users can update their bookings" ON public.bookings;
CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = companion_id);

