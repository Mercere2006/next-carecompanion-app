import Link from 'next/link';
import { HeartHandshake, ShieldAlert, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 sm:pt-14 pb-8 sm:pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Core Disclaimer Box */}
        <div className="mb-10 sm:mb-12 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200/90 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-xs sm:text-sm leading-relaxed min-w-0 flex-1">
            <strong className="text-amber-300 font-bold block mb-0.5 break-words">
              ข้อควรทราบเกี่ยวกับขอบเขตการให้บริการ (Important Ethical & Safety Notice):
            </strong>
            ผู้ให้บริการร่วมเดินทาง (Companion) บนแพลตฟอร์ม Care Companion มีหน้าที่ช่วยเหลือและอำนวยความสะดวกในการเดินทางและทำธุระทั่วไปเท่านั้น{' '}
            <span className="text-white font-semibold underline decoration-amber-400 decoration-2">
              ไม่ใช่ผู้ให้บริการทางการแพทย์ หรือผู้ดูแลรักษาพยาบาลผู้ป่วย
            </span>{' '}
            กรณีผู้เดินทางมีอาการเจ็บป่วยฉุกเฉิน กรุณาติดต่อสายด่วน 1669 ทันที
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Care Companion</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              แพลตฟอร์มกลางเชื่อมโยงระหว่างผู้ที่ต้องการเพื่อนร่วมเดินทางสำหรับผู้สูงอายุและผู้ที่ต้องการความช่วยเหลือ กับผู้ช่วยร่วมเดินทางมืออาชีพที่ผ่านการตรวจสอบตัวตน อุ่นใจทุกก้าวที่ไปทำธุระ
            </p>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 pt-2 flex-wrap">
              <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ติดต่อสอบถามหรือประสานงานฉุกเฉิน: 02-XXX-XXXX</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">เมนูลัด</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/companions" className="hover:text-emerald-400 transition">
                  ค้นหาผู้ช่วย
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-emerald-400 transition">
                  ประเภทธุระที่ให้บริการ
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-emerald-400 transition">
                  ขั้นตอนการจองบริการ
                </Link>
              </li>
              <li>
                <Link href="/auth/onboarding" className="hover:text-emerald-400 transition">
                  สมัครเป็นผู้ช่วยกับเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Trust */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">มาตรฐานความปลอดภัย</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>• สแกนใบหน้าผู้ช่วย</li>
              <li>• ปักหมุดระบุพิกัดจุดรับ-ส่งชัดเจน</li>
              <li>• ระบบรีวิวและให้คะแนนดาวจริง</li>
              <li>• ข้อมูลติดต่อฉุกเฉินสำหรับครอบครัว</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Care Companion</p>
        </div>
      </div>
    </footer>
  );
}
