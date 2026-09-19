import Link from 'next/link';
import { Hospital, Landmark, Building2, ShoppingBag, MapPinned, ArrowUpRight } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'พบแพทย์ / ไปโรงพยาบาล',
    desc: 'พาไปตรวจตามนัด ช่วยติดต่อเคาน์เตอร์ พยุงเดิน รอรับยา และพาเดินทางกลับบ้านอย่างปลอดภัย',
    icon: Hospital,
    color: 'bg-rose-50 text-rose-600 border-rose-150 group-hover:bg-rose-600 group-hover:text-white',
    badge: 'ยอดนิยมสูงสุด',
  },
  {
    id: 2,
    name: 'ติดต่อธนาคาร / การเงิน',
    desc: 'ช่วยพาไปกดเงิน ทำธุรกรรมที่สาขา อำนวยความสะดวกเรื่องการเดินและถือสัมภาระ',
    icon: Landmark,
    color: 'bg-blue-50 text-blue-600 border-blue-150 group-hover:bg-blue-600 group-hover:text-white',
    badge: 'ปลอดภัย & เป็นส่วนตัว',
  },
  {
    id: 3,
    name: 'ติดต่อหน่วยงานราชการ',
    desc: 'พาไปทำบัตรประชาชน ต่ออายุเอกสาร ติดต่อสำนักงานเขต ประกันสังคม หรือยื่นเรื่องต่างๆ',
    icon: Building2,
    color: 'bg-amber-50 text-amber-600 border-amber-150 group-hover:bg-amber-600 group-hover:text-white',
    badge: 'ช่วยเหลือด้านเอกสาร',
  },
  {
    id: 4,
    name: 'ซื้อสินค้า / จ่ายตลาด',
    desc: 'ช่วยถือถุงช้อปปิ้ง เข็นรถ ช่วยเลือกซื้อของใช้เข้าบ้าน หรือไปซูเปอร์มาร์เก็ต',
    icon: ShoppingBag,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-150 group-hover:bg-emerald-600 group-hover:text-white',
    badge: 'ผ่อนแรงถือของ',
  },
  {
    id: 5,
    name: 'ธุระทั่วไปนอกบ้าน',
    desc: 'ไปงานบุญ งานพิธี พบปะเพื่อนฝูง หรือทำธุระส่วนตัวอื่นๆ ที่ต้องการเพื่อนร่วมทางดูแล',
    icon: MapPinned,
    color: 'bg-purple-50 text-purple-600 border-purple-150 group-hover:bg-purple-600 group-hover:text-white',
    badge: 'เพื่อนร่วมทางอุ่นใจ',
  },
];

export default function CategoriesSection() {
  return (
    <section id="categories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            ประเภทธุระที่ให้บริการร่วมเดินทาง
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            เลือกประเภทธุระที่คุณต้องการความช่วยเหลือ Companion ของเราพร้อมดูแลอำนวยความสะดวกตลอดเส้นทาง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${cat.color}`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition">
                    {cat.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                </div>

                <Link
                  href={`/companions?category=${cat.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 pt-4 border-t border-gray-50"
                >
                  ค้นหาผู้ช่วยสำหรับธุระนี้
                  <ArrowUpRight className="w-4 h-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
