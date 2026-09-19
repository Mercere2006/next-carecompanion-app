export type UserRole = 'customer' | 'companion' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// 1. Profile Type
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  emergency_phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// 2. Companion Profile Type
export type VehicleType = 'none' | 'motorcycle' | 'car';

export interface CompanionProfile {
  id: string;
  bio: string | null;
  experience_years: number;
  skills: string[];
  service_areas: string[];
  available_schedule?: string | null; // ช่วงเวลาที่สะดวก เช่น "จันทร์ - ศุกร์ (08:00 - 17:00 น.)"
  hourly_rate: number;
  id_card_image_url: string | null;
  verification_status: VerificationStatus;
  rating_avg: number;
  rating_count: number;
  is_available: boolean;
  phone_verified?: boolean;
  vehicle_type?: VehicleType;
  vehicle_model?: string | null; // เช่น "Honda City สีขาว" หรือ "Yamaha Grand Filano สีฟ้า"
  vehicle_plate?: string | null; // เช่น "1กข 1234 กทม."
  updated_at: string;
}

// 3. Service Category Type
export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

// 4. Booking Type
export interface Booking {
  id: string;
  customer_id: string;
  companion_id: string;
  category_id: number;
  errand_title: string;
  errand_details: string | null;
  origin_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:mm:ss
  duration_hours: number;
  special_needs: string | null;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// 5. Review Type
export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  companion_id: string;
  rating: number; // 1 - 5
  comment: string | null;
  created_at: string;
}

// Composite / Joined Types
export interface CompanionCardData extends CompanionProfile {
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'phone' | 'email'>;
}

export interface BookingDetailData extends Booking {
  customer?: Pick<Profile, 'full_name' | 'avatar_url' | 'phone' | 'emergency_phone' | 'email'>;
  companion?: Pick<Profile, 'full_name' | 'avatar_url' | 'phone' | 'email'>;
  category?: ServiceCategory;
  review?: Review | null;
}
