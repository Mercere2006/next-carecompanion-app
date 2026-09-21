-- ==========================================================
-- SQL Seed: เพิ่มข้อมูล Companion จำลองลงใน Supabase
-- สามารถคัดลอกคำสั่งทั้งหมดไปวางใน Supabase Dashboard -> SQL Editor แล้วกด Run ได้ทันที
-- ==========================================================

-- 1. เพิ่มข้อมูล Profiles
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

-- 2. เพิ่มข้อมูล Companion Profiles
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
  experience_years = EXCLUDED.experience_years,
  skills = EXCLUDED.skills,
  service_areas = EXCLUDED.service_areas,
  available_schedule = EXCLUDED.available_schedule,
  hourly_rate = EXCLUDED.hourly_rate,
  verification_status = EXCLUDED.verification_status,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  is_available = EXCLUDED.is_available,
  phone_verified = EXCLUDED.phone_verified,
  vehicle_type = EXCLUDED.vehicle_type,
  vehicle_model = EXCLUDED.vehicle_model,
  vehicle_plate = EXCLUDED.vehicle_plate,
  updated_at = NOW();
