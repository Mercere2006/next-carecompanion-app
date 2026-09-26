'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailData, CompanionProfile } from '@/types/database';
import { formatThaiDate, formatPrice, getStatusBadgeInfo } from '@/lib/utils';
import { Calendar, Clock, MapPin, Navigation, Phone, CheckCircle2, XCircle, Play, CheckCheck, Star, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import ReviewHeartButton from '@/components/reviews/ReviewHeartButton';
import { addSystemNotification } from '@/lib/notifications';

export default function CompanionDashboard() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [companionProfile, setCompanionProfile] = useState<CompanionProfile | null>(null);

  const fetchCompanionBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch bookings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(full_name, phone, emergency_phone, avatar_url, email),
          category:service_categories(id, name, icon),
          review:reviews(id, rating, comment)
        `)
        .eq('companion_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookings(data as unknown as BookingDetailData[]);
      }

      // Fetch companion's own profile for suspension & warning checks
      const { data: compProfile } = await supabase
        .from('companion_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (compProfile) {
        setCompanionProfile(compProfile as CompanionProfile);

        // Verification approval celebration check
        if (typeof window !== 'undefined') {
          const lastSeenKey = `carecompanion_last_status_${user.id}`;
          const lastSeenStatus = localStorage.getItem(lastSeenKey);
          const shownApprovalKey = `carecompanion_shown_approval_${user.id}`;
          const alreadyShown = localStorage.getItem(shownApprovalKey);

          if (
            compProfile.verification_status === 'verified' &&
            lastSeenStatus === 'pending' &&
            !alreadyShown
          ) {
            localStorage.setItem(shownApprovalKey, 'true');
            Swal.fire({
              title: 'ยินดีด้วย! บัญชีได้รับการอนุมัติแล้ว 🎉',
              html: `
                <div class="text-left space-y-3 text-sm text-gray-600">
                  <p class="font-medium text-gray-800">
                    บัญชี Companion ของคุณได้รับการอนุมัติจากผู้ดูแลระบบเรียบร้อยแล้ว
                  </p>
                  <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-1">
                    <div class="font-bold flex items-center gap-1.5 text-emerald-800">
                      <span>✓</span> สถานะ: ได้รับการอนุมัติแล้ว (พร้อมรับงาน)
                    </div>
                    <p>
                      ระบบได้เปิดสถานะพร้อมให้บริการให้คุณแล้ว คุณสามารถเริ่มรับงานและดูแลลูกค้าได้ทันที
                    </p>
                  </div>
                </div>
              `,
              icon: 'success',
              confirmButtonColor: '#059669',
              confirmButtonText: 'เข้าสู่แดชบอร์ดงาน',
              customClass: {
                popup: 'rounded-3xl shadow-2xl font-sans',
                confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
              },
            });
          } else if (compProfile.verification_status === 'pending') {
            localStorage.removeItem(shownApprovalKey);
          }

          localStorage.setItem(lastSeenKey, compProfile.verification_status || 'none');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check if user was redirected from application submission (?submitted=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('submitted') === '1') {
      Swal.fire({
        title: 'กรุณารอการอนุมัติ',
        html: `
          <div class="text-left space-y-3 text-sm text-gray-600">
            <p class="font-medium text-gray-800">
              ระบบได้รับข้อมูลการสมัครเป็น Companion ของคุณเรียบร้อยแล้ว
            </p>
            <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
              <div class="font-bold flex items-center gap-1.5 text-amber-800">
                <span>⏳</span> สถานะปัจจุบัน: รอการตรวจสอบจากผู้ดูแลระบบ
              </div>
              <p>
                เจ้าหน้าที่แอดมินกำลังตรวจสอบข้อมูลและรูปถ่ายสแกนใบหน้าของคุณ เพื่อความปลอดภัยและรักษามาตรฐานการให้บริการ
              </p>
            </div>
            <p class="text-xs text-gray-500">
              เมื่อได้รับการอนุมัติจากแอดมินแล้ว ระบบจะส่งการแจ้งเตือนไปยังคุณ และเปิดสถานะพร้อมรับงานให้โดยอัตโนมัติครับ
            </p>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#059669',
        confirmButtonText: 'รับทราบ',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
      window.history.replaceState({}, '', '/companion/dashboard');
    }
  }, []);

  useEffect(() => {
    async function init() {
      await fetchCompanionBookings();
    }
    init();

    // Listen for realtime companion_profiles updates (e.g. admin approval)
    const channelId = `comp-dash-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companion_profiles',
        },
        () => {
          fetchCompanionBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchCompanionBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        () => {
          fetchCompanionBookings();
        }
      )
      .subscribe();

    // Active polling interval every 4s so dashboard stays updated without refresh
    const pollingTimer = setInterval(() => {
      fetchCompanionBookings();
    }, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCompanionBookings();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const handleCustomUpdate = () => {
      fetchCompanionBookings();
    };
    window.addEventListener('carecompanion_notification_update', handleCustomUpdate);
    window.addEventListener('storage', handleCustomUpdate);

    return () => {
      clearInterval(pollingTimer);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('carecompanion_notification_update', handleCustomUpdate);
      window.removeEventListener('storage', handleCustomUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchCompanionBookings, supabase]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (companionProfile?.is_suspended) {
      await Swal.fire({
        title: 'บัญชีถูกระงับการให้บริการชั่วคราว',
        html: `
          <div class="text-left space-y-2 text-sm text-gray-700">
            <p class="font-bold text-rose-700">⚠️ คุณไม่สามารถรับงานหรือดำเนินการใดๆ ได้ในขณะนี้</p>
            <p>เนื่องจากบัญชีของคุณถูกระงับการให้บริการชั่วคราว (คะแนนความพึงพอใจเฉลี่ยต่ำกว่า 2.5 ดาว หรือมีข้อร้องเรียนที่อยู่ระหว่างการตรวจสอบ)</p>
            <div class="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed space-y-1">
              <strong>ข้อกำหนดของระบบ:</strong>
              <p>ผู้ช่วยจะไม่สามารถทำอะไรได้ในระหว่างนี้ ต้องรอให้ทีมงานผู้ดูแลระบบ (Admin Care Companion) ตรวจสอบและติดต่อพูดคุยกับคุณก่อนเท่านั้น หลังจากนั้นแอดมินจะเป็นผู้ตัดสินใจสถานะบัญชีของคุณครับ</p>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'รับทราบ',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
      return;
    }

    setUpdatingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Dispatch real-time notification to the customer
      const target = bookings.find((b) => b.id === bookingId);
      if (target?.customer_id) {
        let notifTitle = 'อัปเดตสถานะงาน';
        let notifMsg = `คำขอ "${target.errand_title}" ได้รับการเปลี่ยนสถานะเป็น ${newStatus}`;
        if (newStatus === 'accepted') {
          notifTitle = 'ผู้ช่วยตอบรับงานแล้ว! 🎉';
          notifMsg = `ผู้ช่วยตอบรับคำขอเดินทาง "${target.errand_title}" แล้ว คุณสามารถตรวจสอบเบอร์ติดต่อและสถานะได้ที่แดชบอร์ด`;
        } else if (newStatus === 'rejected') {
          notifTitle = `ผู้ช่วยไม่สะดวกรับงาน: ${target.errand_title}`;
          notifMsg = `ผู้ช่วยไม่สะดวกรับงานในวันดังกล่าว ระบบได้เตรียมผู้ช่วยท่านอื่นที่ว่างแนะนำให้คุณแล้ว`;
        } else if (newStatus === 'in_progress') {
          notifTitle = 'ผู้ช่วยกำลังเดินทางไปยังจุดรับ 🚗';
          notifMsg = `ผู้ช่วยเริ่มออกเดินทางสำหรับงาน "${target.errand_title}" แล้ว`;
        } else if (newStatus === 'completed') {
          notifTitle = 'ภารกิจเสร็จสิ้นแล้ว! ✨';
          notifMsg = `การเดินทางสำหรับ "${target.errand_title}" เสร็จสิ้นแล้ว กรุณาช่วยให้คะแนนและเขียนรีวิวผู้ช่วยของคุณ`;
        }
        addSystemNotification(target.customer_id, {
          type: 'system',
          title: notifTitle,
          message: notifMsg,
          link: '/customer/dashboard',
        });
      }

      fetchCompanionBookings();
    } catch (err) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + (err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const completedJobs = bookings.filter((b) => b.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const pendingJobs = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0">
        {/* Header & Quick Profile Link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight break-words">
              แดชบอร์ดงานผู้ช่วย
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              จัดการคำขอรับบริการ อัปเดตสถานะการเดินทาง และบันทึกงานของคุณ
            </p>
          </div>

          <Link
            href="/companion/profile"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-bold hover:bg-gray-50 shadow-xs"
          >
            ⚙️ จัดการข้อมูลโปรไฟล์ผู้ช่วย
          </Link>
        </div>

{/* Pending Verification Status Banner */}
        {companionProfile?.verification_status === 'pending' && !companionProfile?.is_suspended && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-amber-950">
                    ข้อมูลการสมัครของคุณอยู่ระหว่างการตรวจสอบ (กรุณารอการอนุมัติ)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    รออนุมัติ
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                  ระบบได้รับข้อมูลโปรไฟล์และหลักฐานยืนยันตัวตนของคุณเรียบร้อยแล้ว เจ้าหน้าที่แอดมินกำลังดำเนินการตรวจสอบความถูกต้อง เมื่อได้รับการอนุมัติแล้ว ระบบจะส่งการแจ้งเตือนและเปิดระบบรับงานให้คุณทันที
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verified Status Banner */}
        {companionProfile?.verification_status === 'verified' && !companionProfile?.is_suspended && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-6 sm:mb-8 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">
                  บัญชีของคุณได้รับการอนุมัติแล้ว (พร้อมรับงาน)
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-700">
                  คุณผ่านการตรวจสอบจากผู้ดูแลระบบเรียบร้อยแล้ว พร้อมให้บริการแก่ลูกค้า CareCompanion
                </p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ✓ อนุมัติแล้ว
            </span>
          </div>
        )}

        {/* Rejected Status Banner */}
        {companionProfile?.verification_status === 'rejected' && !companionProfile?.is_suspended && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-rose-950">
                  ข้อมูลการสมัครของคุณไม่ผ่านการอนุมัติ
                </p>
                <p className="text-xs text-rose-800 mt-0.5">
                  กรุณาตรวจสอบข้อมูลและรูปถ่ายในหน้าจัดการโปรไฟล์ และส่งข้อมูลใหม่อีกครั้ง
                </p>
              </div>
            </div>
            <Link
              href="/companion/profile"
              className="shrink-0 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 transition shadow-2xs"
            >
              แก้ไขข้อมูลและส่งใหม่
            </Link>
          </div>
        )}

        {/* Suspension Banner */}
        {companionProfile?.is_suspended && (
          <div className="bg-gradient-to-r from-rose-500/10 via-rose-50 to-red-50 border-2 border-rose-400 rounded-3xl p-5 sm:p-7 mb-6 sm:mb-8 shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black text-rose-950">
                    บัญชีของคุณถูกระงับการให้บริการชั่วคราว (Account Suspended)
                  </h2>
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">
                    ระงับการทำงาน
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                  <strong>สาเหตุ:</strong> {companionProfile.suspension_reason || 'คะแนนความพึงพอใจเฉลี่ยต่ำกว่า 2.5 ดาว หรืออยู่ระหว่างการตรวจสอบข้อร้องเรียน'}
                </p>
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-rose-200 space-y-2 text-xs sm:text-sm text-gray-800">
              <div className="font-bold text-rose-800 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>ข้อกำหนดและสิ่งที่ต้องทำในระหว่างการระงับบัญชี:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-1">
                <li>ระบบได้ปิดสถานะพร้อมรับงานของคุณ และระงับการรับงานใหม่โดยอัตโนมัติ</li>
                <li>ผู้ช่วยจะไม่สามารถตอบรับงาน หรือเปลี่ยนสถานะงานในระบบได้ในระหว่างนี้</li>
                <li><strong>ต้องรอให้ทีมงานผู้ดูแลระบบ (Admin Care Companion) ตรวจสอบข้อมูลและติดต่อพูดคุยกับคุณก่อนเท่านั้น</strong> (ทางโทรศัพท์หรืออีเมล)</li>
                <li>หลังจากแอดมินได้พูดคุยสอบถามข้อเท็จจริงเรียบร้อยแล้ว แอดมินจะเป็นผู้ตัดสินใจว่าจะตักเตือน ปลดการระงับบัญชี หรือดำเนินการอย่างไรต่อไป</li>
              </ul>
            </div>
          </div>
        )}

        {/* Warning Reminder Banner */}
        {!companionProfile?.is_suspended && Boolean(companionProfile?.warning_count && companionProfile.warning_count > 0) && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 sm:mb-8 shadow-2xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong>ข้อความแจ้งเตือนจากผู้ดูแลระบบ:</strong> บัญชีของคุณมีประวัติการตักเตือนสะสม {companionProfile?.warning_count} ครั้ง กรุณารักษามาตรฐานการให้บริการอย่างเคร่งครัดเพื่อป้องกันการถูกระงับบัญชี
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              คำขอรอการตอบรับ
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {pendingJobs.length} งาน
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              งานที่สำเร็จแล้ว
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {completedJobs.length} งาน
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              รายได้สะสมโดยประมาณ
            </span>
            <span className="text-2xl sm:text-3xl font-black text-teal-700">
              {formatPrice(totalEarnings)}
            </span>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const statusInfo = getStatusBadgeInfo(booking.status);
              const isUpdating = updatingId === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-200/80 shadow-xs space-y-4 sm:space-y-5 min-w-0"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {booking.category?.name || 'ธุระทั่วไป'}
                        </span>
                        <span className="text-xs text-gray-400">
                          สร้างเมื่อ {formatThaiDate(booking.created_at)}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-950 mt-1.5 break-words">
                        {booking.errand_title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bgColor}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Body Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Locations & Timing */}
                    <div className="md:col-span-8 space-y-3">
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl text-xs sm:text-sm">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-400 block">จุดรับผู้เดินทาง:</span>
                            <span className="font-semibold text-gray-800">{booking.origin_address}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 pt-2 border-t border-gray-200/60">
                          <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-400 block">จุดส่งปลายทาง:</span>
                            <span className="font-semibold text-gray-800">{booking.destination_address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          วันนัด: {formatThaiDate(booking.appointment_date)}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          เวลา: {booking.start_time.slice(0, 5)} น.
                        </span>
                        {booking.special_needs && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ความต้องการพิเศษ: {booking.special_needs}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Info & Total */}
                    <div className="md:col-span-4 bg-teal-50/40 rounded-2xl p-4 border border-teal-100 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500 font-semibold block">ข้อมูลผู้เดินทาง:</span>
                        <strong className="text-sm text-gray-900 block">
                          {booking.customer?.full_name || 'ลูกค้า'}
                        </strong>

                        {booking.customer?.phone && (
                          <div className="text-xs text-gray-600">
                            <span>โทร: </span>
                            <a
                              href={`tel:${booking.customer.phone}`}
                              className="font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {booking.customer.phone}
                            </a>
                          </div>
                        )}

                        {booking.customer?.emergency_phone && (
                          <div className="text-xs text-rose-600">
                            <span>เบอร์ติดต่อญาติ/ฉุกเฉิน: </span>
                            <a
                              href={`tel:${booking.customer.emergency_phone}`}
                              className="font-bold hover:underline"
                            >
                              {booking.customer.emergency_phone}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-teal-100 mt-3 flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">ค่าบริการที่จะได้รับ:</span>
                        <span className="text-xl font-extrabold text-teal-800">
                          {formatPrice(booking.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Lifecycle Status Transition Bar */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Maps navigation */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${booking.origin_lat || ''},${booking.origin_lng || ''}&destination=${booking.destination_lat || ''},${booking.destination_lng || ''}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      เปิดระบบนำทาง GPS
                    </a>

                    {/* Companion State Controls */}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {booking.status === 'pending' && (
                        companionProfile?.is_suspended ? (
                          <button
                            disabled
                            title="ไม่สามารถรับงานหรือดำเนินการได้เนื่องจากบัญชีถูกระงับการให้บริการชั่วคราว"
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                            ไม่สามารถดำเนินการได้ (บัญชีถูกระงับชั่วคราว)
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              ปฏิเสธงาน
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ตอบรับงานนี้
                            </button>
                          </>
                        )
                      )}

                      {booking.status === 'accepted' && (
                        companionProfile?.is_suspended ? (
                          <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                            ไม่สามารถเริ่มงานได้ (บัญชีถูกระงับชั่วคราว)
                          </button>
                        ) : (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            เริ่มออกเดินทาง / ถึงจุดรับ
                          </button>
                        )
                      )}

                      {booking.status === 'in_progress' && (
                        companionProfile?.is_suspended ? (
                          <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                            ไม่สามารถจบงานได้ (บัญชีถูกระงับชั่วคราว)
                          </button>
                        ) : (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5 animate-bounce cursor-pointer"
                          >
                            <CheckCheck className="w-4 h-4" />
                            เสร็จสิ้นภารกิจ (จบงาน)
                          </button>
                        )
                      )}

                      {booking.status === 'completed' && booking.review && (
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                            <span className="font-bold text-amber-800">{booking.review.rating} ดาว:</span>
                            <span className="italic truncate max-w-[260px]">
                              &quot;{booking.review.comment || 'ไม่มีข้อความ'}&quot;
                            </span>
                          </div>
                          <ReviewHeartButton
                            reviewId={booking.review.id}
                            initialLiked={booking.review.liked_by_companion}
                            canLike={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ยังไม่มีงานเข้ามาในขณะนี้</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              โปรดตรวจสอบว่าคุณได้เปิดสถานะ &quot;พร้อมรับงาน (Available)&quot; ในหน้าตั้งค่าโปรไฟล์แล้ว
            </p>
            <Link
              href="/companion/profile"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition"
            >
              ไปตรวจสอบโปรไฟล์
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
