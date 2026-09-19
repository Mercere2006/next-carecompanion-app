export interface ServiceCategoryOption {
  id: number;
  name: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  { id: 1, name: "พบแพทย์ / ไปโรงพยาบาล" },
  { id: 2, name: "ติดต่อธนาคาร / การเงิน" },
  { id: 3, name: "ติดต่อหน่วยงานราชการ" },
  { id: 4, name: "ซื้อสินค้า / จ่ายตลาด" },
  { id: 5, name: "ธุระทั่วไป" },
];

export const QUICK_SPECIAL_NEEDS = [
  "ช่วยพยุงเดิน",
  "ใช้วีลแชร์ / เข็นรถ",
  "มีรถยนต์ส่วนตัว",
  "สื่อสารภาษาอังกฤษ",
];

export const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
