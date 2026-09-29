'use client';

import { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Swal from 'sweetalert2';
import ReportCompanionModal from './ReportCompanionModal';

interface ReportCompanionButtonProps {
  companionId: string;
  companionName: string;
  companionAvatar?: string | null;
  className?: string;
  onSuccess?: () => void;
}

export default function ReportCompanionButton({
  companionId,
  companionName,
  companionAvatar,
  className = '',
  onSuccess,
}: ReportCompanionButtonProps) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);

  // If user returned from Google OAuth with ?report=1, automatically open the report modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('report') === '1') {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            setIsOpen(true);
            // Clean up query param from URL without reloading
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        });
      }
    }
  }, [supabase]);

  const handleReportClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const result = await Swal.fire({
        title: 'เข้าสู่ระบบเพื่อรายงานผู้ช่วย',
        html: `
          <div class="text-left space-y-3 text-sm text-gray-600">
            <p class="font-medium text-gray-800">
              คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชี Google ก่อน จึงจะสามารถส่งรายงานข้อร้องเรียนผู้ช่วย <strong>${companionName}</strong> ได้
            </p>
            <div class="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1">
              <p class="font-bold text-rose-800 flex items-center gap-1.5">
                <span>🔒</span> จำเป็นต้องยืนยันตัวตนผู้รายงาน
              </p>
              <p>
                การส่งรายงานต้องระบุตัวตนของผู้รายงาน เพื่อให้ผู้ดูแลระบบสามารถตรวจสอบข้อเท็จจริงและติดต่อสอบถามเพิ่มเติมได้อย่างโปร่งใส
              </p>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
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
              `/companions/${companionId}?report=1`
            )}`,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
      }
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleReportClick}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl border border-gray-200 hover:border-rose-200 transition cursor-pointer ${className}`}
      >
        <Flag className="w-3.5 h-3.5 text-rose-500" />
        <span>รายงานผู้ช่วยท่านนี้</span>
      </button>

      <ReportCompanionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        companionId={companionId}
        companionName={companionName}
        companionAvatar={companionAvatar}
        onSuccess={onSuccess}
      />
    </>
  );
}
