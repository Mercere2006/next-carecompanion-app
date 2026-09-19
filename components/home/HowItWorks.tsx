import { ClipboardList, UserCheck, ShieldCheck, ThumbsUp } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'ระบุความต้องการธุระ',
    desc: 'เลือกประเภทธุระ วันที่ เวลา พร้อมปักหมุดจุดรับ-ส่งบนแผนที่ และระบุความต้องการพิเศษ เช่น รถเข็น หรือช่วยถือของ',
    icon: ClipboardList,
  },
  {
    step: '02',
    title: 'เลือก Companion ที่ตรงใจ',
    desc: 'ดูข้อมูลประวัติ ประสบการณ์ พื้นที่ให้บริการ เรตติ้งรีวิว และอัตราค่าบริการเพื่อเลือกคนที่เหมาะสมที่สุด',
    icon: UserCheck,
  },
  {
    step: '03',
    title: 'ยืนยันและนัดหมาย',
    desc: 'Companion ตรวจสอบรายละเอียดและกดตอบรับงาน ระบบแสดงข้อมูลติดต่อฉุกเฉินพร้อมให้นัดพบตรงเวลา',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'เดินทางปลอดภัย & รีวิว',
    desc: 'ติดตามสถานะการเดินทางแบบเรียลไทม์จนจบภารกิจ พร้อมให้คะแนนและรีวิวเพื่อรักษามาตรฐานชุมชน',
    icon: ThumbsUp,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            ขั้นตอนการใช้บริการ Care Companion
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            ออกแบบให้ใช้งานง่าย ทั้งสำหรับผู้สูงอายุและลูกหลานที่ต้องการจองแทน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-gray-200/70 shadow-xs relative flex flex-col justify-between hover:-translate-y-1 transition duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-black text-emerald-600 font-mono">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
