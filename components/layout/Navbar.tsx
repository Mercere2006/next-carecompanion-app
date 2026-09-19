'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { HeartHandshake, User, LogOut, Menu, X, Shield, Calendar, Search, Sparkles, Briefcase } from 'lucide-react';

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCompanion, setIsCompanion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);

          // Check if user has companion profile
          const { data: comp } = await supabase
            .from('companion_profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          setIsCompanion(!!comp || data?.role === 'companion');
        } else {
          setProfile(null);
          setIsCompanion(false);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 transition group-hover:scale-105">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight flex items-center gap-1.5">
                Care Companion
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  TH
                </span>
              </span>
              <p className="text-[11px] text-gray-500 font-medium">เพื่อนร่วมทางที่คุณอุ่นใจ</p>
            </div>
          </Link>

          {/* Right Navigation & Action Controls */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#categories"
              className="text-sm font-bold text-gray-800 hover:text-emerald-700 transition"
            >
              ประเภทธุระ
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-bold text-gray-800 hover:text-emerald-700 transition"
            >
              ขั้นตอนการใช้งาน
            </Link>
            <Link
              href="/companions"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              ค้นหาผู้ช่วย
            </Link>

            {loading ? (
              <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full" />
            ) : profile ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                {/* Customer Trips Link */}
                <Link
                  href="/customer/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 border border-emerald-200 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  คำขอของฉัน
                </Link>

                {/* Mode Switch: If companion -> Companion Dashboard; If not yet -> Become Companion */}
                {isCompanion ? (
                  <Link
                    href="/companion/dashboard"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-800 font-semibold text-xs hover:bg-teal-100 border border-teal-200 transition"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                    งาน Companion ของฉัน
                  </Link>
                ) : (
                  <Link
                    href="/companion/profile"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-800 font-semibold text-xs hover:bg-teal-100 border border-teal-200 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    ยืนยันตัวตนเพื่อรับงาน
                  </Link>
                )}

                {/* Admin Link if admin */}
                {profile.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 font-semibold text-xs hover:bg-amber-100 border border-amber-300 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                {/* User Dropdown Profile info */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-300">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left leading-tight pr-1">
                    <p className="text-xs font-bold text-gray-800 max-w-[110px] truncate">
                      {profile.full_name || 'ผู้ใช้งาน'}
                    </p>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {isCompanion ? 'Customer & Companion' : 'Customer'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="ออกจากระบบ"
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-900 bg-white/70 hover:bg-white border border-gray-200/80 shadow-2xs transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-10 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-5 space-y-3">
          <Link
            href="/#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2"
          >
            ประเภทธุระ
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2"
          >
            ขั้นตอนการใช้งาน
          </Link>
          <Link
            href="/companions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm"
          >
            ค้นหาผู้ช่วย
          </Link>

          <div className="pt-3 border-t border-gray-100">
            {profile ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500">
                  เข้าสู่ระบบในชื่อ: <strong className="text-emerald-800">{profile.full_name}</strong>
                </p>
                <Link
                  href="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm"
                >
                  คำขอของฉัน (Customer)
                </Link>
                {isCompanion ? (
                  <Link
                    href="/companion/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-teal-50 text-teal-800 font-bold text-sm"
                  >
                    งาน Companion ของฉัน
                  </Link>
                ) : (
                  <Link
                    href="/companion/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm"
                  >
                    ยืนยันตัวตนเพื่อรับงาน (สแกนใบหน้า)
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-rose-600 font-bold border border-rose-200 rounded-xl text-sm"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
