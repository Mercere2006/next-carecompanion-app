'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { Profile, CompanionCardData, BookingDetailData } from '@/types/database';
import { formatPrice, formatThaiDate, getStatusBadgeInfo } from '@/lib/utils';
import { Shield, Users, CheckCircle2, XCircle, FileText, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'bookings'>('verification');

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // 1. Fetch Companions awaiting verification
      const { data: compData } = await supabase
        .from('companion_profiles')
        .select(`
          *,
          profile:profiles(full_name, email, phone, avatar_url)
        `)
        .order('updated_at', { ascending: false });

      if (compData) setCompanions(compData as unknown as CompanionCardData[]);

      // 2. Fetch all users
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userData) setUsers(userData as Profile[]);

      // 3. Fetch all bookings
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(full_name, phone, email),
          companion:profiles!bookings_companion_id_fkey(full_name, phone, email),
          category:service_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (bookingData) setBookings(bookingData as unknown as BookingDetailData[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleVerifyCompanion = async (companionId: string, status: 'verified' | 'rejected') => {
    setProcessingId(companionId);
    try {
      const { error } = await supabase
        .from('companion_profiles')
        .update({
          verification_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companionId);

      if (error) throw error;
      alert(`อัปเดตสถานะเป็น ${status === 'verified' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'} เรียบร้อย`);
      fetchAdminData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('verification_docs')
        .createSignedUrl(filePath, 120); // 2 minutes valid

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      alert('ไม่สามารถเปิดไฟล์เอกสารได้: ' + (err as Error).message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'customer' | 'companion' | 'admin') => {
    if (!confirm(`ต้องการเปลี่ยนสิทธิ์ผู้ใช้นี้เป็น ${newRole} ใช่หรือไม่?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      alert('เปลี่ยนสิทธิ์สำเร็จ');
      fetchAdminData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-gray-200 shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าระบบแอดมิน หากคุณเป็นผู้ดูแล ให้ไปเปลี่ยนคอลัมน์ `role` ในตาราง `profiles` ของคุณเป็น `admin` ผ่าน Supabase Table Editor
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingVerificationCount = companions.filter((c) => c.verification_status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              Platform Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1 break-words">
              แผงควบคุมผู้ดูแลระบบ (Admin)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              บริหารจัดการผู้ใช้งาน อนุมัติเอกสาร Companion และติดตามความเรียบร้อยของแพลตฟอร์ม
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">ผู้ใช้ทั้งหมด</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{users.length} คน</span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">Companion ในระบบ</span>
            <span className="text-2xl sm:text-3xl font-black text-teal-700">{companions.length} คน</span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-amber-200 bg-amber-50/40 shadow-xs">
            <span className="text-xs font-bold text-amber-800 block mb-1">รอตรวจเอกสาร (Pending)</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingVerificationCount} คน</span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">การจองทั้งหมด</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{bookings.length} รายการ</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            ตรวจเอกสาร Companion ({pendingVerificationCount})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            จัดการผู้ใช้งาน ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'bookings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            รายการจองทั้งหมด ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Verification */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                รายการ Companion ที่รอการตรวจสอบเอกสารยืนยันตัวตน
              </h2>
            </div>

            {companions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Companion</th>
                      <th className="px-6 py-4">เบอร์ติดต่อ</th>
                      <th className="px-6 py-4">เอกสารบัตรประชาชน</th>
                      <th className="px-6 py-4">สถานะปัจจุบัน</th>
                      <th className="px-6 py-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companions.map((comp) => {
                      const isProcessing = processingId === comp.id;

                      return (
                        <tr key={comp.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <strong className="text-gray-900 block font-semibold">
                              {comp.profile?.full_name || 'ไม่ระบุชื่อ'}
                            </strong>
                            <span className="text-xs text-gray-400">{comp.profile?.email}</span>
                          </td>
                          <td className="px-6 py-4">{comp.profile?.phone || '-'}</td>
                          <td className="px-6 py-4">
                            {comp.id_card_image_url ? (
                              <button
                                onClick={() => handleViewDocument(comp.id_card_image_url!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs border border-blue-200"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                เปิดดูเอกสาร (Secure Link)
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">ยังไม่อัปโหลด</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                comp.verification_status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : comp.verification_status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {comp.verification_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleVerifyCompanion(comp.id, 'verified')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50"
                            >
                              อนุมัติ (Verify)
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleVerifyCompanion(comp.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 border border-rose-200 disabled:opacity-50"
                            >
                              ปฏิเสธ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-8 text-center text-gray-400 text-sm">ยังไม่มี Companion ในระบบ</p>
            )}
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">รายชื่อผู้ใช้งานทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">ผู้ใช้</th>
                    <th className="px-6 py-4">อีเมล</th>
                    <th className="px-6 py-4">เบอร์โทร</th>
                    <th className="px-6 py-4">สิทธิ์ (Role)</th>
                    <th className="px-6 py-4 text-right">เปลี่ยนสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {u.full_name || 'ผู้ใช้งาน'}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">{u.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 capitalize">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleChangeRole(u.id, 'admin')}
                            className="text-xs font-bold text-amber-700 hover:underline"
                          >
                            ตั้งเป็น Admin
                          </button>
                        )}
                        {u.role !== 'companion' && (
                          <button
                            onClick={() => handleChangeRole(u.id, 'companion')}
                            className="text-xs font-bold text-teal-700 hover:underline"
                          >
                            ตั้งเป็น Companion
                          </button>
                        )}
                        {u.role !== 'customer' && (
                          <button
                            onClick={() => handleChangeRole(u.id, 'customer')}
                            className="text-xs font-bold text-emerald-700 hover:underline"
                          >
                            ตั้งเป็น Customer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">รายการคำขอจองทั้งหมดในระบบ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">หัวข้อธุระ</th>
                    <th className="px-6 py-4">ผู้จอง (Customer)</th>
                    <th className="px-6 py-4">ผู้ช่วย (Companion)</th>
                    <th className="px-6 py-4">วันและเวลา</th>
                    <th className="px-6 py-4">ยอดเงิน</th>
                    <th className="px-6 py-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => {
                    const statusInfo = getStatusBadgeInfo(b.status);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <strong className="text-gray-900 block font-semibold">{b.errand_title}</strong>
                          <span className="text-xs text-gray-400">
                            {b.origin_address} ➔ {b.destination_address}
                          </span>
                        </td>
                        <td className="px-6 py-4">{b.customer?.full_name || 'ลูกค้า'}</td>
                        <td className="px-6 py-4">{b.companion?.full_name || 'ผู้ช่วย'}</td>
                        <td className="px-6 py-4">
                          {formatThaiDate(b.appointment_date)} {b.start_time?.slice(0, 5)} น.
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {formatPrice(b.total_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bgColor}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
