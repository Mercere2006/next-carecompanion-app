'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addSystemNotification } from '@/lib/notifications';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import Swal from 'sweetalert2';

interface ReportCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companionId: string;
  companionName: string;
  companionAvatar?: string | null;
  bookingId?: string | null;
  initialReason?: string;
  initialDetails?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  'พฤติกรรมไม่เหมาะสม / ใช้วาจาไม่สุภาพ',
  'มาสายมาก หรือไม่มาตามนัดหมาย (No-show)',
  'เรียกเก็บเงินเพิ่มเกินจริงนอกระบบ',
  'ขับขี่ยานพาหนะไม่ปลอดภัย / รถยนต์ไม่ได้มาตรฐาน',
  'การให้บริการไม่ตรงตามข้อตกลงที่ระบุไว้',
  'การละเมิดความเป็นส่วนตัวหรือไม่ปลอดภัย',
  'อื่นๆ (โปรดระบุรายละเอียดด้านล่าง)',
];

export default function ReportCompanionModal({
  isOpen,
  onClose,
  companionId,
  companionName,
  companionAvatar,
  bookingId = null,
  initialReason = '',
  initialDetails = '',
  onSuccess,
}: ReportCompanionModalProps) {
  const supabase = createClient();
  const [reason, setReason] = useState(initialReason || REPORT_REASONS[0]);
  const [details, setDetails] = useState(initialDetails);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      Swal.fire({
        title: 'กรุณาเลือกสาเหตุ',
        text: 'โปรดเลือกสาเหตุที่ต้องการรายงานผู้ช่วย',
        icon: 'warning',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'ยืนยันการส่งรายงาน?',
      text: 'รายงานของคุณจะถูกส่งตรงไปยังผู้ดูแลระบบเพื่อตรวจสอบข้อเท็จจริง',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // rose-600
      cancelButtonColor: '#64748b',  // slate-500
      confirmButtonText: 'ใช่, ส่งรายงาน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans border border-gray-100',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
      },
    });

    if (!confirmResult.isConfirmed) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Swal.fire({
          title: 'กรุณาเข้าสู่ระบบ',
          text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถส่งรายงานได้',
          icon: 'info',
          confirmButtonColor: '#059669',
          confirmButtonText: 'ตกลง',
        });
        return;
      }

      const reportPayload = {
        customer_id: user.id,
        companion_id: companionId,
        booking_id: bookingId ? bookingId : null,
        reason,
        details: details.trim() || null,
        status: 'pending' as const,
      };

      const { data: insertedReport, error } = await supabase
        .from('reports')
        .insert(reportPayload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Report submission insert error:', error);
        throw error;
      }

      // Notify all admin users of the new incoming report
      try {
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (adminUsers && adminUsers.length > 0) {
          adminUsers.forEach((adm) => {
            addSystemNotification(adm.id, {
              id: `rep-notif-${insertedReport?.id || Date.now()}`,
              type: 'system',
              title: 'มีรายงานข้อร้องเรียนใหม่เข้ามา! ⚠️',
              message: `มีรายงานผู้ช่วย "${companionName}" ในหัวข้อ "${reason}" กรุณาตรวจสอบในแดชบอร์ด`,
              link: '/admin',
            });
          });
        }
      } catch (notifErr) {
        console.warn('Admin notification dispatch error:', notifErr);
      }

      await Swal.fire({
        title: 'ส่งรายงานเรียบร้อยแล้ว',
        text: 'ผู้ดูแลระบบได้รับเรื่องแล้ว และจะดำเนินการตรวจสอบข้อเท็จจริงเพื่อความปลอดภัยของทุกคนครับ',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'รับทราบ',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'ส่งรายงานไม่สำเร็จ',
        text: (err as Error).message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                รายงานผู้ช่วย (Report Companion)
              </h3>
              <p className="text-xs text-gray-500">แจ้งเรื่องร้องเรียนถึงผู้ดูแลระบบโดยตรง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Companion Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-gray-200/70">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 border border-white shadow-xs">
            {companionAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companionAvatar} alt={companionName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              ผู้ช่วยที่รายงาน
            </span>
            <strong className="text-sm font-bold text-gray-900 truncate block">
              {companionName}
            </strong>
            {bookingId && (
              <span className="text-[11px] text-gray-500 block truncate">
                รหัสงาน: #{bookingId.slice(0, 8)}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              สาเหตุที่ต้องการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-medium"
              required
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              รายละเอียดเพิ่มเติม / เหตุการณ์ที่เกิดขึ้น
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="กรุณาระบุรายละเอียด เช่น วันเวลา สถานที่เกิดเหตุ หรือพฤติกรรมที่ไม่เหมาะสม เพื่อให้แอดมินตรวจสอบได้อย่างรวดเร็ว..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none font-medium"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              ทุกรายงานจะถูกเก็บเป็นความลับ แอดมินจะติดต่อผู้ช่วยเพื่อสอบถามข้อเท็จจริง และอาจพิจารณาตักเตือนหรือระงับบัญชีตามเกณฑ์ความปลอดภัย
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งรายงานต่อแอดมิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
