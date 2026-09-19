'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailData } from '@/types/database';
import { formatThaiDate, formatPrice, getStatusBadgeInfo } from '@/lib/utils';
import { Calendar, Clock, MapPin, Navigation, Phone, CheckCircle2, XCircle, Play, CheckCheck, Star } from 'lucide-react';
import Link from 'next/link';

export default function CompanionDashboard() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCompanionBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCompanionBookings();
  }, [fetchCompanionBookings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
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
              แดชบอร์ดงาน Companion
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              จัดการคำขอรับบริการ อัปเดตสถานะการเดินทาง และบันทึกงานของคุณ
            </p>
          </div>

          <Link
            href="/companion/profile"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-bold hover:bg-gray-50 shadow-xs"
          >
            ⚙️ จัดการโปรไฟล์ / เอกสาร
          </Link>
        </div>

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
                          เวลา: {booking.start_time.slice(0, 5)} น. ({booking.duration_hours} ชม.)
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
                      )}

                      {booking.status === 'accepted' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          เริ่มออกเดินทาง / ถึงจุดรับ
                        </button>
                      )}

                      {booking.status === 'in_progress' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5 animate-bounce cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                          เสร็จสิ้นภารกิจ (จบงาน)
                        </button>
                      )}

                      {booking.status === 'completed' && booking.review && (
                        <div className="w-full sm:w-auto flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ลูกค้าให้ {booking.review.rating} ดาว: &quot;{booking.review.comment}&quot;
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
