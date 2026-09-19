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

export const MOCK_COMPANIONS: CompanionCardData[] = [];

