'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';
import { HeartHandshake, UserCheck, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to home if not logged in
        router.push('/');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || user.user_metadata?.full_name || '');
        setPhone(profile.phone || '');
        if (profile.role) setRole(profile.role);
      } else {
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      }

      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ');
      return;
    }

    if (!cleanPhone.startsWith('0')) {
      setErrorMsg('เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 เท่านั้น (เช่น 0812345678)');
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (ขึ้นต้นด้วย 0)');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // 2. If role is companion, ensure a companion_profiles row exists (not available until verified and profile completed)
      if (role === 'companion') {
        const { error: compError } = await supabase
          .from('companion_profiles')
          .upsert({
            id: userId,
            verification_status: 'pending',
            is_available: false,
            hourly_rate: 0,
            updated_at: new Date().toISOString(),
          });

        if (compError) console.error('Companion profile init error:', compError);
        router.push('/companion/profile');
      } else {
        router.push('/customer/dashboard');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">กำลังเตรียมข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-xl border border-gray-100 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-950 break-words">
            ยินดีต้อนรับสู่ Care Companion
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            กรุณาเลือกบทบาทของคุณและกรอกข้อมูลเบื้องต้นเพื่อเริ่มใช้งาน
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-800">
              เลือกบทบาทของคุณในระบบ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Option Customer */}
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  role === 'customer'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {role === 'customer' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
                )}
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Customer</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  ผู้ต้องการผู้ช่วยร่วมเดินทางสำหรับตนเองหรือคนในครอบครัว
                </p>
              </button>

              {/* Option Companion */}
              <button
                type="button"
                onClick={() => setRole('companion')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  role === 'companion'
                    ? 'border-teal-600 bg-teal-50/50 shadow-md shadow-teal-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {role === 'companion' && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 absolute top-4 right-4" />
                )}
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Companion</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  ผู้ให้บริการร่วมเดินทาง อำนวยความสะดวกในการทำธุระ
                </p>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              ชื่อ - นามสกุลจริง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น สมศรี ใจดี"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 10) v = v.slice(0, 10);
                setPhone(v);
              }}
              placeholder="เช่น 0812345678"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base font-mono"
            />
            <p className="text-xs text-gray-500">
              *เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 เท่านั้น (10 หลัก)
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-bold text-lg hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'เข้าสู่ระบบ Care Companion'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
