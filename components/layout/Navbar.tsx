'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { HeartHandshake, User, LogOut, Menu, X, Shield, Calendar, Search, Briefcase, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCompanion, setIsCompanion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    async function loadUser() {
      try {
        if (typeof window !== 'undefined' && window.location.search.includes('demo_user=1')) {
          setProfile({
            id: 'demo-user-1',
            full_name: 'นายพฤกษ์ธกร วิสุทธินันท์',
            email: 'pruek@example.com',
            phone: '0812345678',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: 'companion',
            emergency_phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setIsCompanion(true);
          setLoading(false);
          return;
        }

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
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 transition group-hover:scale-105 shrink-0">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight flex items-center gap-1 sm:gap-1.5 truncate">
                Care Companion
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  TH
                </span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">เพื่อนร่วมทางที่คุณอุ่นใจ</p>
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

                {/* Real-time Notification Bell for Incoming Customer Requests */}
                <NotificationBell userId={profile.id} />

                {/* User Profile Menu with Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl hover:bg-gray-100/80 transition cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-300 shrink-0">
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left leading-tight hidden lg:block">
                      <p className="text-xs font-bold text-gray-800 max-w-[120px] truncate">
                        {profile.full_name || 'ผู้ใช้งาน'}
                      </p>
                      <span className="text-[10px] text-gray-400 capitalize">
                        {isCompanion ? 'Customer & Companion' : 'Customer'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{profile.full_name || 'ผู้ใช้งาน'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{profile.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {isCompanion ? 'Customer & Companion' : 'Customer'}
                        </span>
                      </div>

                      <div className="py-1">
                        {isCompanion ? (
                          <Link
                            href="/companion/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                          >
                            <Briefcase className="w-4 h-4 text-teal-600" />
                            งาน Companion ของฉัน
                          </Link>
                        ) : (
                          <Link
                            href="/companion/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            <Shield className="w-4 h-4 text-teal-600" />
                            สมัคร/ยืนยันตัวตน Companion
                          </Link>
                        )}

                        <Link
                          href="/customer/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                        >
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          คำขอของฉัน (Customer)
                        </Link>

                        {isCompanion && (
                          <Link
                            href="/companion/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                          >
                            <User className="w-4 h-4 text-gray-400" />
                            จัดการข้อมูลโปรไฟล์ผู้ช่วย
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu & Quick Notification Button */}
          <div className="flex md:hidden items-center gap-2">
            {profile && <NotificationBell userId={profile.id} />}
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
