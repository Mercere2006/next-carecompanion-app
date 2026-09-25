'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailData } from '@/types/database';
import { formatThaiDate, formatPrice, getStatusBadgeInfo } from '@/lib/utils';
import { Calendar, MapPin, Navigation, Star, Plus, Phone, User, Clock, AlertCircle, ArrowRight, RefreshCw, Flag } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import ReportCompanionModal from '@/components/customer/ReportCompanionModal';

export default function CustomerDashboard() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingDetailData | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report modal state
  const [reportingBooking, setReportingBooking] = useState<{
    bookingId: string;
    companionId: string;
    companionName: string;
    companionAvatar?: string | null;
    initialDetails?: string;
  } | null>(null);

  const fetchBookings = useCallback(async () => {
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
          companion:profiles!bookings_companion_id_fkey(full_name, avatar_url, phone, email),
          category:service_categories(*),
          review:reviews(*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as unknown as BookingDetailData[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      await fetchBookings();
    }
    init();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    const result = await Swal.fire({
      title: 'ต้องการยกเลิกคำขอนี้ใช่หรือไม่?',
      text: 'หากยกเลิกแล้ว คำขอนี้จะไม่ถูกดำเนินการต่อ คุณแน่ใจหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // rose-600
      cancelButtonColor: '#64748b',  // slate-500
      confirmButtonText: 'ใช่, ยกเลิกคำขอ',
      cancelButtonText: 'ไม่, กลับไปก่อน',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans border border-gray-100',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
      },
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      await Swal.fire({
        title: 'ยกเลิกคำขอเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonColor: '#059669', // emerald-600
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });

      fetchBookings();
    } catch (err) {
      Swal.fire({
        title: 'ไม่สามารถยกเลิกได้',
        text: (err as Error).message,
        icon: 'error',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    setSubmittingReview(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('reviews').insert({
        booking_id: selectedBookingForReview.id,
        customer_id: user.id,
        companion_id: selectedBookingForReview.companion_id,
        rating,
        comment,
      });

      if (error) throw error;

      await Swal.fire({
        title: 'บันทึกรีวิวสำเร็จ',
        text: 'ขอบคุณสำหรับคะแนนและรีวิวของคุณ!',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });

      const targetBooking = selectedBookingForReview;
      const submittedComment = comment;
      setSelectedBookingForReview(null);
      setComment('');
      fetchBookings();

      // Trigger low-rating report prompt
      if (rating <= 2) {
        const askReport = await Swal.fire({
          title: 'การบริการมีปัญหาหรือไม่?',
          text: 'คุณให้คะแนนต่ำกว่าเกณฑ์ (1-2 ดาว) หากพบปัญหาการบริการหรือพฤติกรรมไม่เหมาะสม คุณต้องการส่งรายงานข้อร้องเรียนนี้ถึงผู้ดูแลระบบ (Admin) เพื่อช่วยตรวจสอบด้วยหรือไม่?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e11d48',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'ใช่, ต้องการรายงาน',
          cancelButtonText: 'ไม่ต้องการ, ขอบคุณ',
          reverseButtons: true,
          customClass: {
            popup: 'rounded-3xl shadow-2xl font-sans border border-gray-100',
            confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
            cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
          },
        });

        if (askReport.isConfirmed) {
          setReportingBooking({
            bookingId: targetBooking.id,
            companionId: targetBooking.companion_id,
            companionName: targetBooking.companion?.full_name || 'ผู้ช่วยร่วมเดินทาง',
            companionAvatar: targetBooking.companion?.avatar_url,
            initialDetails: submittedComment,
          });
        }
      }
    } catch (err) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: (err as Error).message,
        icon: 'error',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight break-words">
              คำขอใช้บริการของฉัน
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              ติดตามสถานะการจอง ข้อมูลผู้ช่วยร่วมเดินทาง และประวัติการเดินทางของคุณ
            </p>
          </div>

          <Link
            href="/companions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 shadow-md shadow-emerald-200 transition"
          >
            <Plus className="w-4 h-4" />
            จองผู้ช่วยร่วมเดินทางใหม่
          </Link>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {bookings.map((booking) => {
              const statusInfo = getStatusBadgeInfo(booking.status);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-200/80 shadow-xs space-y-4 sm:space-y-5 min-w-0"
                >
                  {/* Top Bar: Title, Category & Status */}
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

                  {/* SMART FALLBACK BANNER (เมื่อ Companion ปฏิเสธหรือไม่ว่าง) */}
                  {booking.status === 'rejected' && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            ผู้ช่วยท่านนี้ไม่สะดวกรับงานในวันและเวลาดังกล่าว
                          </strong>
                          <span className="text-xs text-amber-700">
                            ไม่ต้องกรอกข้อมูลใหม่! คุณสามารถเลือก Companion ท่านอื่นในละแวกนี้ได้ทันที
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/companions?category=${booking.category?.name || ''}&area=${encodeURIComponent(booking.origin_address.slice(0, 15))}`}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        เลือกผู้ช่วยท่านอื่นแทน
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Body: Journey & Companion Info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Journey Details */}
                    <div className="md:col-span-8 space-y-3">
                      {/* Locations */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl text-xs sm:text-sm">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-400 block">จุดรับ:</span>
                            <span className="font-semibold text-gray-800">{booking.origin_address}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 pt-2 border-t border-gray-200/60">
                          <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-400 block">จุดส่ง:</span>
                            <span className="font-semibold text-gray-800">{booking.destination_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          วันนัดหมาย: {formatThaiDate(booking.appointment_date)}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          เวลา: {booking.start_time.slice(0, 5)} น.
                        </span>
                        {booking.special_needs && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ความต้องการพิเศษ: {booking.special_needs}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Companion info & Price */}
                    <div className="md:col-span-4 bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500 font-semibold block">ผู้ช่วยร่วมเดินทาง:</span>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden shrink-0">
                            {booking.companion?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={booking.companion.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <strong className="text-sm text-gray-900 block">
                              {booking.companion?.full_name || 'ผู้ช่วยร่วมเดินทาง'}
                            </strong>
                            {booking.companion?.phone ? (
                              <a
                                href={`tel:${booking.companion.phone}`}
                                className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition shadow-2xs"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                โทร {booking.companion.phone}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 block mt-0.5">ไม่มีข้อมูลเบอร์โทร</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-emerald-100/80 mt-3 flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">ยอดรวม:</span>
                        <span className="text-xl font-extrabold text-emerald-700">
                          {formatPrice(booking.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Navigation Links */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${booking.origin_lat || ''},${booking.origin_lng || ''}&destination=${booking.destination_lat || ''},${booking.destination_lng || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        ดูเส้นทางบน Google Maps
                      </a>
                    </div>

                    {/* State Actions */}
                    <div className="flex items-center justify-end gap-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="w-full sm:w-auto text-xs font-semibold px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer text-center"
                        >
                          ยกเลิกคำขอ
                        </button>
                      )}

                      {booking.status === 'completed' && !booking.review && (
                        <button
                          onClick={() => {
                            setSelectedBookingForReview(booking);
                            setRating(5);
                            setComment('');
                          }}
                          className="w-full sm:w-auto text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          ให้คะแนนและรีวิว
                        </button>
                      )}

                      {booking.status === 'completed' && booking.review && (
                        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          รีวิวแล้ว ({booking.review.rating} ดาว)
                        </div>
                      )}

                      {/* Report Companion Button */}
                      <button
                        onClick={() =>
                          setReportingBooking({
                            bookingId: booking.id,
                            companionId: booking.companion_id,
                            companionName: booking.companion?.full_name || 'ผู้ช่วยร่วมเดินทาง',
                            companionAvatar: booking.companion?.avatar_url,
                          })
                        }
                        title="รายงานข้อร้องเรียนเกี่ยวกับผู้ช่วยท่านนี้"
                        className="text-xs font-semibold px-3 py-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5 text-gray-400" />
                        <span>รายงานผู้ช่วย</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ยังไม่มีรายการคำขอจองบริการ</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              เมื่อคุณจองผู้ช่วยร่วมเดินทาง รายการและสถานะงานจะแสดงที่นี่แบบเรียลไทม์
            </p>
            <Link
              href="/companions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 transition shadow-md shadow-emerald-200"
            >
              ค้นหาผู้ช่วยเพื่อเริ่มนัดหมาย
            </Link>
          </div>
        )}

        {/* Review Modal */}
        {selectedBookingForReview && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-950">ให้คะแนนและรีวิวบริการ</h3>
                <p className="text-xs text-gray-500">
                  สำหรับงาน: {selectedBookingForReview.errand_title}
                </p>
              </div>

              <form onSubmit={handleSaveReview} className="space-y-5">
                {/* Rating Stars */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">ความคิดเห็นเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="เล่าประสบการณ์ เช่น สุภาพมาก ช่วยเหลือดี ตรงเวลา..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForReview(null)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {submittingReview ? 'กำลังบันทึก...' : 'ส่งรีวิว'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Companion Modal */}
        {reportingBooking && (
          <ReportCompanionModal
            isOpen={Boolean(reportingBooking)}
            onClose={() => setReportingBooking(null)}
            companionId={reportingBooking.companionId}
            companionName={reportingBooking.companionName}
            companionAvatar={reportingBooking.companionAvatar}
            bookingId={reportingBooking.bookingId}
            initialDetails={reportingBooking.initialDetails}
            onSuccess={() => fetchBookings()}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
