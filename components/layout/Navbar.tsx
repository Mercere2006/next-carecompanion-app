'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { HeartHandshake, User, LogOut, Menu, X, Shield, Search, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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
          let { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // Check if user has companion profile and fetch uploaded avatar / id_card_image_url
          const { data: comp } = await supabase
            .from('companion_profiles')
            .select('id, id_card_image_url')
            .eq('id', user.id)
            .maybeSingle();

          const isGoogleAvatar = (url?: string | null) =>
            Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));

          let localAvatarOverride: string | null = null;
          let localNameOverride: string | null = null;
          if (typeof window !== 'undefined') {
            localAvatarOverride = localStorage.getItem('user_avatar_override');
            localNameOverride = localStorage.getItem('user_fullname_override');
          }

          // Prioritize user's uploaded photo over Google OAuth photo
          let resolvedAvatar: string | null = null;
          if (data?.avatar_url && !isGoogleAvatar(data.avatar_url)) {
            resolvedAvatar = data.avatar_url;
          } else if (comp?.id_card_image_url) {
            resolvedAvatar = comp.id_card_image_url;
          } else if (localAvatarOverride) {
            resolvedAvatar = localAvatarOverride;
          } else if (data?.avatar_url) {
            resolvedAvatar = data.avatar_url;
          } else {
            resolvedAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          }

          if (!data) {
            // Profile row was deleted from public.profiles table, but auth session exists!
            // Re-create initial profile row automatically from Google Auth user metadata:
            const fallbackProfile: Profile = {
              id: user.id,
              email: user.email || '',
              full_name:
                localNameOverride ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'ผู้ใช้งาน',
              avatar_url: resolvedAvatar,
              phone: user.user_metadata?.phone || null,
              emergency_phone: null,
              role: comp ? 'companion' : 'customer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: upsertedData } = await supabase
              .from('profiles')
              .upsert(fallbackProfile)
              .select()
              .single();

            data = upsertedData || fallbackProfile;
          } else {
            data = {
              ...data,
              full_name: localNameOverride || data.full_name,
              avatar_url: resolvedAvatar,
            };

            // If companion has uploaded photo but profiles table still holds Google avatar,
            // sync profiles.avatar_url in background
            if (comp?.id_card_image_url && (!data.avatar_url || isGoogleAvatar(data.avatar_url))) {
              supabase
                .from('profiles')
                .update({ avatar_url: comp.id_card_image_url, updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .then(() => {});
            }
          }

          setProfile(data);
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

    const handleProfileUpdate = () => {
      loadUser();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('profileUpdated', handleProfileUpdate);
      window.addEventListener('storage', (e) => {
        if (e.key === 'user_avatar_override' || e.key === 'profile_updated') {
          loadUser();
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('profileUpdated', handleProfileUpdate);
      }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
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
            {profile ? (
              profile.role !== 'admin' ? (
                <>
                  <Link
                    href={isCompanion ? '/companion/dashboard' : '/companion/profile'}
                    className="text-sm font-bold text-gray-800 hover:text-emerald-700 transition"
                  >
                    งานผู้ช่วยของฉัน
                  </Link>
                  <Link
                    href="/customer/dashboard"
                    className="text-sm font-bold text-gray-800 hover:text-emerald-700 transition"
                  >
                    คำขอของฉัน
                  </Link>
                </>
              ) : (
                <Link
                  href="/admin"
                  className={`text-sm font-bold transition ${
                    pathname === '/admin'
                      ? 'text-emerald-700 font-extrabold'
                      : 'text-gray-800 hover:text-emerald-700'
                  }`}
                >
                  ภาพรวมผู้ดูแลระบบ
                </Link>
              )
            ) : (
              <>
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
              </>
            )}
            <Link
              href="/companions"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              ดูผู้ช่วย
            </Link>

            {loading ? (
              <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full" />
            ) : profile ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
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
                        {profile.role === 'admin' ? 'Admin' : (profile.full_name || 'ผู้ใช้งาน')}
                      </p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {profile.role === 'admin' ? 'Admin' : (profile.full_name || 'ผู้ใช้งาน')}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{profile.email}</p>
                      </div>

                      {profile.role !== 'admin' ? (
                        <div className="py-1">
                          {isCompanion ? (
                            <Link
                              href="/companion/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                            >
                              <User className="w-4 h-4 text-gray-400" />
                              จัดการข้อมูลโปรไฟล์ผู้ช่วย
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
                        </div>
                      ) : (
                        <div className="py-1">
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-50 transition"
                          >
                            <Shield className="w-4 h-4 text-amber-600" />
                            ภาพรวมผู้ดูแลระบบ
                          </Link>
                        </div>
                      )}

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
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          {profile ? (
            profile.role !== 'admin' && (
              <>
                <Link
                  href={isCompanion ? '/companion/dashboard' : '/companion/profile'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-gray-800 py-2 hover:text-emerald-700 transition"
                >
                  งานผู้ช่วยของฉัน
                </Link>
                <Link
                  href="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-gray-800 py-2 hover:text-emerald-700 transition"
                >
                  คำขอของฉัน
                </Link>
              </>
            )
          ) : (
            <>
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
            </>
          )}

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-bold text-amber-800 py-2 hover:text-amber-900 transition flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-600" />
              ภาพรวมผู้ดูแลระบบ
            </Link>
          )}

          <Link
            href="/companions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm"
          >
            ดูผู้ช่วย
          </Link>

          <div className="pt-3 border-t border-gray-100">
            {profile ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500">
                  เข้าสู่ระบบในชื่อ: <strong className="text-emerald-800">{profile.role === 'admin' ? 'Admin' : profile.full_name}</strong>
                </p>
                {profile.role !== 'admin' && (
                  <Link
                    href="/companion/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm"
                  >
                    {isCompanion ? 'จัดการข้อมูลโปรไฟล์ผู้ช่วย' : 'ยืนยันตัวตนเพื่อรับงาน (สแกนใบหน้า)'}
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
