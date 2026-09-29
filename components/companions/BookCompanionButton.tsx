'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Swal from 'sweetalert2';

interface BookCompanionButtonProps {
  companionId: string;
  companionName: string;
  isSuspended?: boolean;
  initialIsLoggedIn?: boolean;
}

export default function BookCompanionButton({
  companionId,
  companionName,
  isSuspended = false,
  initialIsLoggedIn = false,
}: BookCompanionButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleBookingClick = async () => {
    if (isSuspended) return;

    // Check live login status
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Force user to login with Google to book companion
      const result = await Swal.fire({
        title: 'เข้าสู่ระบบเพื่อจองผู้ช่วย',
        html: `
          <div class="text-left space-y-3 text-sm text-gray-600">
            <p class="font-medium text-gray-800">
              คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชี Google ก่อนดำเนินการจองผู้ช่วยร่วมเดินทาง <strong>${companionName}</strong>
            </p>
            <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-1">
              <p class="font-bold text-emerald-800 flex items-center gap-1.5">
                <span>✓</span> เข้าสู่ระบบรวดเร็วใน 1 คลิก
              </p>
              <p>
                เมื่อเข้าสู่ระบบเสร็จสิ้น ระบบจะพาคุณกลับมาที่หน้าผู้ช่วยคนนี้ทันทีเพื่อดำเนินการจองต่อ
              </p>
            </div>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'เข้าสู่ระบบด้วย Google',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
          cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
        },
      });

      if (result.isConfirmed) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              `/companions/${companionId}`
            )}`,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
      }
      return;
    }

    // User is logged in: Navigate to the booking form
    router.push(`/customer/book/${companionId}`);
  };

  if (isSuspended) {
    return (
      <div className="w-full py-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-500 font-bold text-center text-sm flex items-center justify-center gap-2 cursor-not-allowed">
        <AlertTriangle className="w-4 h-4 text-gray-400" />
        ไม่สามารถจองได้ (บัญชีถูกระงับชั่วคราว)
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBookingClick}
      className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-bold text-center text-base hover:bg-emerald-800 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
    >
      <Calendar className="w-5 h-5" />
      จองผู้ช่วยร่วมเดินทาง
    </button>
  );
}
