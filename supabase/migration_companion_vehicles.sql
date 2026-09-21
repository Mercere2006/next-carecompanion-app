-- SQL Migration: เพิ่มคอลัมน์ประเภทยานพาหนะ, ช่วงเวลาให้บริการ และการยืนยันเบอร์โทรศัพท์ในตาราง companion_profiles
-- สามารถ Copy คำสั่งนี้ไปวางและกด Run ในหน้า SQL Editor ของ Supabase Dashboard ได้ทันที

ALTER TABLE companion_profiles 
ADD COLUMN IF NOT EXISTS available_schedule TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;

-- สร้าง Index เพื่อเพิ่มประสิทธิภาพในการค้นหา
CREATE INDEX IF NOT EXISTS idx_companion_profiles_vehicle_type ON companion_profiles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_companion_profiles_is_available ON companion_profiles(is_available);
