'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, MapPin, Heart, ArrowRight, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-teal-50/20 to-white pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-20 w-[700px] h-[350px] rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold border border-emerald-200 shadow-xs mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>แพลตฟอร์มบริการผู้ช่วยร่วมเดินทางที่คุณวางใจได้</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.18] max-w-4xl mx-auto">
          เพื่อนร่วมทางที่คุณไว้วางใจ{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            อุ่นใจทุกก้าวที่ไปทำธุระ
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          บริการผู้ช่วยร่วมเดินทางสำหรับผู้สูงอายุและผู้ที่เดินทางคนเดียวไม่สะดวก ช่วยดูแลอำนวยความสะดวกในการไปพบแพทย์ ทำธุรกรรมธนาคาร ติดต่อราชการ หรือซื้อของนอกบ้าน
        </p>

        {/* Main Action Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/companions"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-700 text-white text-base sm:text-lg font-bold hover:bg-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Search className="w-5 h-5" />
            ค้นหาผู้ช่วย
            <ArrowRight className="w-5 h-5" />
          </Link>

          {isLoggedIn ? (
            <Link
              href="/customer/dashboard"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white text-emerald-800 border-2 border-emerald-200 text-base sm:text-lg font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <Calendar className="w-5 h-5 text-emerald-600" />
              ไปยังคำขอของฉัน
            </Link>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white text-gray-800 border-2 border-gray-200 text-base sm:text-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-xs active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-14 pt-8 border-t border-gray-200/80 grid grid-cols-3 gap-6 text-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <strong className="text-gray-900 font-bold text-xs sm:text-sm">Verified 100%</strong>
            <span className="text-[11px] sm:text-xs text-gray-500">ตรวจเอกสารยืนยันตัวตน</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
              <MapPin className="w-4 h-4" />
            </div>
            <strong className="text-gray-900 font-bold text-xs sm:text-sm">ปักหมุด GPS</strong>
            <span className="text-[11px] sm:text-xs text-gray-500">ระบุพิกัดรับ-ส่งชัดเจน</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5">
              <Heart className="w-4 h-4" />
            </div>
            <strong className="text-gray-900 font-bold text-xs sm:text-sm">อุ่นใจทุกเส้นทาง</strong>
            <span className="text-[11px] sm:text-xs text-gray-500">รีวิวคะแนนจากผู้ใช้จริง</span>
          </div>
        </div>
      </div>
    </section>
  );
}
