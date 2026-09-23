'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import Image from 'next/image';

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
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  return (
    <section className="relative overflow-hidden flex flex-col justify-center min-h-[calc(100vh-5rem)] min-h-[calc(100dvh-5rem)] py-12 sm:py-16 lg:py-20">
      {/* Background Image from public/images/companion.jpg */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/companion.jpg"
          alt="Care Companion"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center sm:object-[center_25%]"
        />
        {/* Soft readable overlay: photo is clearly visible while keeping Thai typography crisp and readable */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 max-w-4xl mx-auto leading-tight sm:leading-relaxed break-words">
          <span className="block">เพื่อนร่วมทางที่คุณไว้วางใจ</span>
          <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent pb-1">
            อุ่นใจทุกก้าวที่ไปทำธุระ
          </span>
        </h1>

        {/* Description */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
          บริการผู้ช่วยร่วมเดินทางสำหรับผู้สูงอายุและผู้ที่เดินทางคนเดียวไม่สะดวก ช่วยดูแลอำนวยความสะดวกในการไปพบแพทย์ ทำธุรกรรมธนาคาร ติดต่อราชการ ซื้อของ หรือทำธุระทั่วไป
        </p>

        {/* Main Action Buttons: Stacked vertically with wider bars */}
        <div className="mt-7 sm:mt-9 flex flex-col items-center justify-center gap-3 sm:gap-3.5 max-w-md mx-auto w-full">
          <Link
            href="/companions"
            className="w-full py-4 px-8 rounded-2xl bg-emerald-700 text-white text-base sm:text-lg font-bold hover:bg-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            ดูผู้ช่วย
          </Link>

          {isLoggedIn ? (
            <Link
              href="/customer/dashboard"
              className="w-full py-4 px-8 rounded-2xl bg-white text-emerald-800 border-2 border-emerald-200 text-base sm:text-lg font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <Calendar className="w-5 h-5 text-emerald-600" />
              ไปยังคำขอของฉัน
            </Link>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 px-8 rounded-2xl bg-white text-gray-800 border-2 border-gray-200 text-base sm:text-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-xs active:scale-95 cursor-pointer"
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
      </div>
    </section>
  );
}
