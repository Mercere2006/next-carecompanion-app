import { CompanionCardData } from "@/types/database";

export interface ErrandCategoryDef {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  iconName: "hospital" | "bank" | "government" | "market" | "general";
  color: {
    accent: string;
    bgLight: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    activeBg: string;
    activeText: string;
    ring: string;
  };
  keywords: string[];
}

export const ERRAND_CATEGORIES: ErrandCategoryDef[] = [
  {
    id: 1,
    slug: "hospital",
    name: "พบแพทย์ / ไปโรงพยาบาล",
    shortName: "พบแพทย์ / รพ.",
    badge: "ยอดนิยมสูงสุด",
    description: "พาไปตรวจตามนัด ช่วยติดต่อเคาน์เตอร์ รพ. พยุงเดิน รอรับยา และพาเดินทางกลับบ้านอย่างปลอดภัย",
    iconName: "hospital",
    color: {
      accent: "text-rose-600",
      bgLight: "bg-rose-50",
      border: "border-rose-200",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
      badgeText: "text-rose-700",
      activeBg: "bg-rose-600 text-white shadow-md shadow-rose-200",
      activeText: "text-white",
      ring: "ring-rose-400",
    },
    keywords: [
      "แพทย์",
      "โรงพยาบาล",
      "รพ.",
      "พยาบาล",
      "สุขภาพ",
      "ตรวจสุขภาพ",
      "รับยา",
      "คลินิก",
      "hospital",
      "medical",
      "พยุงเดิน",
      "วีลแชร์",
      "ปฐมพยาบาล",
    ],
  },
  {
    id: 2,
    slug: "bank",
    name: "ติดต่อธนาคาร / การเงิน",
    shortName: "ธนาคาร / การเงิน",
    badge: "ปลอดภัย & รัดกุม",
    description: "ช่วยพาไปกดเงิน ทำธุรกรรมที่สาขาธนาคาร อำนวยความสะดวกเรื่องการเดินและดูแลความปลอดภัย",
    iconName: "bank",
    color: {
      accent: "text-blue-600",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
      badgeText: "text-blue-700",
      activeBg: "bg-blue-600 text-white shadow-md shadow-blue-200",
      activeText: "text-white",
      ring: "ring-blue-400",
    },
    keywords: [
      "ธนาคาร",
      "การเงิน",
      "ธุรกรรม",
      "bank",
      "finance",
      "กดเงิน",
      "สาขา",
      "เคาน์เตอร์ธนาคาร",
    ],
  },
  {
    id: 3,
    slug: "government",
    name: "ติดต่อหน่วยงานราชการ",
    shortName: "ติดต่อราชการ",
    badge: "เอกสาร & ยื่นเรื่อง",
    description: "พาไปทำบัตรประชาชน ต่ออายุเอกสาร ติดต่อสำนักงานเขต อำเภอ ประกันสังคม หรือยื่นเรื่องต่างๆ",
    iconName: "government",
    color: {
      accent: "text-amber-600",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
      badgeText: "text-amber-800",
      activeBg: "bg-amber-600 text-white shadow-md shadow-amber-200",
      activeText: "text-white",
      ring: "ring-amber-400",
    },
    keywords: [
      "ราชการ",
      "เขต",
      "อำเภอ",
      "บัตรประชาชน",
      "พาสปอร์ต",
      "ประกันสังคม",
      "ที่ดิน",
      "government",
      "ยื่นเรื่อง",
      "เอกสาร",
    ],
  },
  {
    id: 4,
    slug: "market",
    name: "ซื้อสินค้า / จ่ายตลาด",
    shortName: "ซื้อของ / จ่ายตลาด",
    badge: "ผ่อนแรงถือของ",
    description: "ช่วยถือถุงช้อปปิ้ง เข็นรถ ช่วยเลือกซื้อของใช้เข้าบ้าน จ่ายตลาด ซูเปอร์มาร์เก็ต หรือห้างสรรพสินค้า",
    iconName: "market",
    color: {
      accent: "text-emerald-700",
      bgLight: "bg-emerald-50",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      badgeText: "text-emerald-800",
      activeBg: "bg-emerald-700 text-white shadow-md shadow-emerald-200",
      activeText: "text-white",
      ring: "ring-emerald-400",
    },
    keywords: [
      "ซื้อ",
      "ตลาด",
      "ช้อป",
      "สัมภาระ",
      "ของใช้",
      "ซูเปอร์",
      "ห้าง",
      "shopping",
      "market",
      "ยกสัมภาระ",
      "จ่ายตลาด",
    ],
  },
  {
    id: 5,
    slug: "general",
    name: "ธุระทั่วไป",
    shortName: "ธุระทั่วไป",
    badge: "เพื่อนร่วมทางอุ่นใจ",
    description: "ไปงานบุญ งานพิธี พบปะเพื่อนฝูง หรือทำธุระส่วนตัวทั่วไป ที่ต้องการเพื่อนร่วมทางคอยดูแลและช่วยเหลือ",
    iconName: "general",
    color: {
      accent: "text-purple-600",
      bgLight: "bg-purple-50",
      border: "border-purple-200",
      badgeBg: "bg-purple-100 text-purple-800 border-purple-300",
      badgeText: "text-purple-700",
      activeBg: "bg-purple-600 text-white shadow-md shadow-purple-200",
      activeText: "text-white",
      ring: "ring-purple-400",
    },
    keywords: [
      "ธุระทั่วไป",
      "งานบุญ",
      "เพื่อนร่วมทาง",
      "ทั่วไป",
      "general",
      "อเนกประสงค์",
      "เดินทาง",
      "คล่องตัว",
    ],
  },
];

/**
 * วิเคราะห์และส่งคืนรายการหมวดหมู่ธุระที่ Companion ท่านนี้รองรับ
 */
export function getCompanionCategories(companion: CompanionCardData): ErrandCategoryDef[] {
  const bio = (companion.bio || "").toLowerCase();
  const skills = (companion.skills || []).map((s) => s.toLowerCase());

  const matched: ErrandCategoryDef[] = [];

  for (const cat of ERRAND_CATEGORIES) {
    const isMatch = cat.keywords.some((kw) => {
      const lowerKw = kw.toLowerCase();
      return (
        bio.includes(lowerKw) ||
        skills.some((skill) => skill.includes(lowerKw))
      );
    });

    if (isMatch) {
      matched.push(cat);
    }
  }

  // หากไม่มีหมวดหมู่ที่ตรวจพบ ให้จัดเข้าหมวดธุระทั่วไปเป็นค่าเริ่มต้น
  if (matched.length === 0) {
    const generalCat = ERRAND_CATEGORIES.find((c) => c.id === 5);
    if (generalCat) matched.push(generalCat);
  }

  return matched;
}

/**
 * ตรวจสอบว่า Companion รองรับหมวดหมู่ธุระที่ระบุหรือไม่
 */
export function isCompanionMatchingCategory(
  companion: CompanionCardData,
  categoryParam?: string | number | null
): boolean {
  if (!categoryParam) return true;

  const raw = String(categoryParam).trim().toLowerCase();
  if (
    !raw ||
    raw === "all" ||
    raw === "ทั้งหมด" ||
    raw === "ทุกประเภทธุระ" ||
    raw === "เลือกทุกประเภทธุระ" ||
    raw === "0"
  ) {
    return true;
  }

  // ตรวจสอบตาม ID โดยตรง (1-5)
  if (raw === "1" || raw === "hospital") {
    return getCompanionCategories(companion).some((c) => c.id === 1);
  }
  if (raw === "2" || raw === "bank") {
    return getCompanionCategories(companion).some((c) => c.id === 2);
  }
  if (raw === "3" || raw === "government") {
    return getCompanionCategories(companion).some((c) => c.id === 3);
  }
  if (raw === "4" || raw === "market") {
    return getCompanionCategories(companion).some((c) => c.id === 4);
  }
  if (raw === "5" || raw === "general") {
    return getCompanionCategories(companion).some((c) => c.id === 5);
  }

  // ตรวจสอบตามชื่อหรือคีย์เวิร์ด
  const matchingCat = ERRAND_CATEGORIES.find((cat) => {
    return (
      cat.name.toLowerCase().includes(raw) ||
      raw.includes(cat.name.toLowerCase()) ||
      cat.slug.toLowerCase() === raw ||
      cat.shortName.toLowerCase().includes(raw)
    );
  });

  if (matchingCat) {
    return getCompanionCategories(companion).some((c) => c.id === matchingCat.id);
  }

  // Fallback: ตรวจสอบตรงกับ bio หรือ skills
  const bio = (companion.bio || "").toLowerCase();
  const skills = (companion.skills || []).map((s) => s.toLowerCase());
  return bio.includes(raw) || skills.some((s) => s.includes(raw));
}

/**
 * จัดกลุ่มรายชื่อ Companion ตามแต่ละหมวดหมู่ธุระ
 */
export function groupCompanionsByCategory(
  companions: CompanionCardData[]
): Array<{
  category: ErrandCategoryDef;
  companions: CompanionCardData[];
}> {
  return ERRAND_CATEGORIES.map((cat) => {
    const list = companions.filter((comp) =>
      getCompanionCategories(comp).some((c) => c.id === cat.id)
    );
    return {
      category: cat,
      companions: list,
    };
  });
}
