import { CompanionCardData } from "@/types/database";
import { ComboboxOption } from "@/components/ui/ComboboxSelect";

export const SERVICE_CATEGORIES = [
  { id: 1, name: "พบแพทย์ / ไปโรงพยาบาล" },
  { id: 2, name: "ติดต่อธนาคาร / การเงิน" },
  { id: 3, name: "ติดต่อหน่วยงานราชการ" },
  { id: 4, name: "ซื้อสินค้า / จ่ายตลาด" },
  { id: 5, name: "ธุระทั่วไป" },
];

export const CATEGORY_OPTIONS: ComboboxOption[] = [
  { label: "ธุระทั่วไป (โปรดระบุ)", value: "ธุระทั่วไป" },
  { label: "พบแพทย์ / ไปโรงพยาบาล", value: "พบแพทย์ / ไปโรงพยาบาล" },
  { label: "ติดต่อธนาคาร / การเงิน", value: "ติดต่อธนาคาร / การเงิน" },
  { label: "ติดต่อหน่วยงานราชการ", value: "ติดต่อหน่วยงานราชการ" },
  { label: "ซื้อสินค้า / จ่ายตลาด", value: "ซื้อสินค้า / จ่ายตลาด" },
];

export const SPECIAL_NEED_OPTIONS: ComboboxOption[] = [
  { label: "ความช่วยเหลือทั่วไป (โปรดระบุ)", value: "ความช่วยเหลือทั่วไป" },
  { label: "ต้องการคนช่วยพยุงเดิน", value: "ต้องการคนช่วยพยุงเดิน" },
  { label: "ใช้วีลแชร์ / เข็นรถ", value: "ใช้วีลแชร์ / เข็นรถ" },
  { label: "ต้องการคนมีรถยนต์ส่วนตัว", value: "ต้องการคนมีรถยนต์ส่วนตัว" },
  {
    label: "ต้องการคนสื่อสารภาษาอังกฤษได้",
    value: "ต้องการคนสื่อสารภาษาอังกฤษได้",
  },
];

export const MOCK_COMPANIONS: CompanionCardData[] = [
  {
    id: "d1000000-0000-0000-0000-000000000001",
    bio: "อดีตบุรุษพยาบาลเกษียณ ใจเย็น มีประสบการณ์ดูแลผู้สูงอายุและผู้ป่วยพักฟื้นกว่า 8 ปี มีรถยนต์ส่วนตัวพร้อมอำนวยความสะดวก รับส่งไปโรงพยาบาลและรอรับยา",
    experience_years: 8,
    skills: [
      "ดูแลผู้สูงอายุ",
      "พาไปโรงพยาบาล",
      "ช่วยพยุงเดิน",
      "มีรถยนต์ส่วนตัว",
      "ปฐมพยาบาลเบื้องต้น",
    ],
    service_areas: ["บางกอกน้อย", "พญาไท", "ศิริราช", "ราชวิถี", "ธนบุรี"],
    available_schedule: "จันทร์ - ศุกร์ (08:00 - 17:00 น.)",
    hourly_rate: 350,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 4.9,
    rating_count: 32,
    is_available: true,
    phone_verified: true,
    vehicle_type: "car",
    vehicle_model: "Toyota Corolla Altis สีบรอนซ์เงิน",
    vehicle_plate: "4กข 1234 กทม.",
    updated_at: "2026-09-20T00:00:00Z",
    profile: {
      full_name: "คุณสมชาย ใจดี",
      avatar_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      phone: "081-234-5678",
      email: "somchai.care@example.com",
    },
  },
  {
    id: "d1000000-0000-0000-0000-000000000002",
    bio: "พยาบาลวิชาชีพพาร์ทไทม์ ชำนาญการพาผู้สูงอายุไปพบแพทย์ที่ รพ.จุฬาฯ รพ.รามาฯ รพ.ศิริราช สื่อสารภาษาอังกฤษคล่องแคล่ว ช่วยพยุงและเข็นวีลแชร์ได้อย่างถูกต้องตามหลักสรีรศาสตร์",
    experience_years: 5,
    skills: [
      "พยาบาลวิชาชีพ",
      "สื่อสารภาษาอังกฤษ",
      "ใช้วีลแชร์ / เข็นรถ",
      "ช่วยพยุงเดิน",
      "พาไปโรงพยาบาล",
    ],
    service_areas: ["ปทุมวัน", "สีลม", "สาทร", "พญาไท", "สุขุมวิท"],
    available_schedule: "ทุกวัน (07:00 - 16:00 น.)",
    hourly_rate: 300,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 5.0,
    rating_count: 46,
    is_available: true,
    phone_verified: true,
    vehicle_type: "none",
    vehicle_model: null,
    vehicle_plate: null,
    updated_at: "2026-09-20T00:00:00Z",
    profile: {
      full_name: "คุณวิภาดา ศรีสุข",
      avatar_url:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      phone: "089-876-5432",
      email: "vipada.care@example.com",
    },
  },
  {
    id: "d1000000-0000-0000-0000-000000000003",
    bio: "บริการขับรถยนต์ส่วนตัวและพาส่งทำธุรกรรมธนาคาร ติดต่อหน่วยงานราชการ ทำพาสปอร์ต บัตรประชาชน ชำนาญเส้นทางในกรุงเทพฯ และปริมณฑล ช่วยยกสัมภาระและพาจ่ายตลาด",
    experience_years: 6,
    skills: [
      "มีรถยนต์ส่วนตัว",
      "ติดต่อหน่วยงานราชการ",
      "ติดต่อธนาคาร / การเงิน",
      "ซื้อสินค้า / จ่ายตลาด",
      "ยกสัมภาระ",
    ],
    service_areas: ["จตุจักร", "ลาดพร้าว", "บางซื่อ", "ดอนเมือง", "นนทบุรี"],
    available_schedule: "จันทร์ - เสาร์ (09:00 - 18:00 น.)",
    hourly_rate: 380,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 4.8,
    rating_count: 24,
    is_available: true,
    phone_verified: true,
    vehicle_type: "car",
    vehicle_model: "Honda Civic สีขาว",
    vehicle_plate: "7กง 5678 กทม.",
    updated_at: "2026-09-20T00:00:00Z",
    profile: {
      full_name: "คุณกิตติศักดิ์ มั่งคั่ง",
      avatar_url:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      phone: "086-555-4321",
      email: "kittisak.care@example.com",
    },
  },
  {
    id: "d1000000-0000-0000-0000-000000000004",
    bio: "ผู้ช่วยรุ่นใหม่ อารมณ์ดี มีความอดทนสูง มีมอเตอร์ไซค์ส่วนตัว คล่องตัวในเขตเมือง พาไปซื้อของ จ่ายตลาด รับยาแทน หรือติดต่อธุระด่วนนอกบ้านได้อย่างรวดเร็ว",
    experience_years: 3,
    skills: [
      "ซื้อสินค้า / จ่ายตลาด",
      "รับยาแทน",
      "ธุระทั่วไป",
      "มีมอเตอร์ไซค์ส่วนตัว",
      "คล่องตัว",
    ],
    service_areas: ["สยาม", "พระราม 9", "รัชดา", "ห้วยขวาง", "ดินแดง"],
    available_schedule: "อังคาร - อาทิตย์ (10:00 - 19:00 น.)",
    hourly_rate: 220,
    id_card_image_url: null,
    verification_status: "verified",
    rating_avg: 4.9,
    rating_count: 38,
    is_available: true,
    phone_verified: true,
    vehicle_type: "motorcycle",
    vehicle_model: "Honda Click 160 สีดำ",
    vehicle_plate: "2ขข 9876 กทม.",
    updated_at: "2026-09-20T00:00:00Z",
    profile: {
      full_name: "คุณธนพร รัตนศิลป์",
      avatar_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      phone: "092-333-8899",
      email: "thanaporn.care@example.com",
    },
  },
];

export interface MockReviewItem {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const MOCK_REVIEWS: Record<string, MockReviewItem[]> = {
  "d1000000-0000-0000-0000-000000000001": [
    {
      id: "rev-101",
      rating: 5,
      comment:
        "คุณสมชายขับรถนิ่มมาก พาคุณแม่ไปหาหมอที่ รพ.ศิริราช ช่วยดูแลประคองขึ้นลงรถและช่วยถือเอกสารตลอดเวลา ประทับใจมากครับ",
      created_at: "2026-09-18T10:30:00Z",
      customer: {
        full_name: "คุณณภัทร วราโชค",
        avatar_url:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-102",
      rating: 5,
      comment:
        "ตรงเวลามาก สุภาพ และใจเย็นมาก ช่วยรอรับยาและอธิบายคำแนะนำของแพทย์ให้ฟังอย่างละเอียด แนะนำเลยค่ะ",
      created_at: "2026-09-15T14:20:00Z",
      customer: {
        full_name: "คุณกานดา สุวรรณรัตน์",
        avatar_url:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-103",
      rating: 5,
      comment:
        "มีประสบการณ์ดูแลผู้สูงอายุอย่างแท้จริง พยุงเดินถูกท่า คุณแม่ชมไม่ขาดปาก ไว้จะใช้บริการอีกแน่นอนครับ",
      created_at: "2026-09-10T11:00:00Z",
      customer: {
        full_name: "คุณธีรพงศ์ รัตนดำรง",
        avatar_url:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
      },
    },
  ],
  "d1000000-0000-0000-0000-000000000002": [
    {
      id: "rev-201",
      rating: 5,
      comment:
        "น้องฟ้าดูแลคุณยายดีมากๆ ช่วยเข็นวีลแชร์อย่างระมัดระวัง สื่อสารกับคุณหมอและพยาบาลได้อย่างคล่องแคล่ว อุ่นใจมากค่ะ",
      created_at: "2026-09-19T09:15:00Z",
      customer: {
        full_name: "คุณพิมพ์ใจ อัครเดช",
        avatar_url:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-202",
      rating: 5,
      comment:
        "Vipada speaks fluent English and assisted my elderly father at Chulalongkorn Hospital smoothly. Truly excellent service!",
      created_at: "2026-09-16T15:40:00Z",
      customer: {
        full_name: "Mr. David Miller",
        avatar_url:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-203",
      rating: 5,
      comment:
        "น่ารัก สดใส พูดจาเพราะ ช่วยประคองคุณยายตรวจเลือดและนั่งรอรับยาอย่างใจเย็น ให้ 5 ดาวเต็มเลยค่ะ",
      created_at: "2026-09-12T13:10:00Z",
      customer: {
        full_name: "คุณสุนทรี พงษ์ไพโรจน์",
        avatar_url:
          "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
      },
    },
  ],
  "d1000000-0000-0000-0000-000000000003": [
    {
      id: "rev-301",
      rating: 5,
      comment:
        "พาไปทำธุรกรรมธนาคารและยื่นเอกสารที่เขต ชำนาญขั้นตอนมาก รถยนต์สะอาด แอร์เย็น ขับปลอดภัยครับ",
      created_at: "2026-09-17T11:45:00Z",
      customer: {
        full_name: "คุณวิทยา เกียรติอนันต์",
        avatar_url:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-302",
      rating: 5,
      comment:
        "ช่วยพาคุณตาไปจ่ายตลาด ยกของหนักให้ทั้งหมด มีน้ำใจและตรงต่อเวลามากค่ะ",
      created_at: "2026-09-13T16:00:00Z",
      customer: {
        full_name: "คุณชุติมา เจริญพร",
        avatar_url:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
      },
    },
  ],
  "d1000000-0000-0000-0000-000000000004": [
    {
      id: "rev-401",
      rating: 5,
      comment:
        "น้องเมย์คล่องแคล่วมาก ช่วยไปรับยาและซื้อของใช้ด่วนในชั่วโมงเร่งด่วน ส่งถึงบ้านรวดเร็วเรียบร้อยค่ะ",
      created_at: "2026-09-18T13:30:00Z",
      customer: {
        full_name: "คุณพัชรี เลิศปรีชา",
        avatar_url:
          "https://images.unsplash.com/photo-1548142813-c348350df52b?w=120&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "rev-402",
      rating: 5,
      comment:
        "บริการดีมาก ขี่มอเตอร์ไซค์ปลอดภัย ใส่หมวกกันน็อกให้ครบ สุภาพเรียบร้อยมากครับ",
      created_at: "2026-09-14T10:00:00Z",
      customer: {
        full_name: "คุณธวัชชัย รุ่งโรจน์",
        avatar_url:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
      },
    },
  ],
};

export const DEFAULT_MOCK_REVIEWS: MockReviewItem[] = [
  {
    id: "rev-def-1",
    rating: 5,
    comment:
      "ผู้ช่วยสุภาพและตรงเวลามาก ช่วยดูแลการเดินทางเป็นอย่างดี ให้ความช่วยเหลืออย่างเต็มที่ตลอดการทำธุระ",
    created_at: "2026-09-17T09:00:00Z",
    customer: {
      full_name: "คุณสมศักดิ์ รัตนชัย",
      avatar_url:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "rev-def-2",
    rating: 5,
    comment:
      "บริการดีมาก อุ่นใจที่ได้เดินทางด้วย แนะนำสำหรับผู้ที่ต้องการผู้ช่วยพาผู้สูงอายุไปทำธุระครับ",
    created_at: "2026-09-11T14:30:00Z",
    customer: {
      full_name: "คุณปาริฉัตร วรสาร",
      avatar_url:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    },
  },
];


