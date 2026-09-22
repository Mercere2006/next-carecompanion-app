'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { Profile, CompanionCardData, BookingDetailData } from '@/types/database';
import { formatPrice, formatThaiDate, getStatusBadgeInfo } from '@/lib/utils';
import { Users, Calendar, AlertTriangle, Eye, ScanFace, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'bookings'>('verification');

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [showMockData, setShowMockData] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null);

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
          profile:profiles(full_name, email, phone, avatar_url, role)
        `)
        .order('updated_at', { ascending: false });

      if (compData) {
        // Exclude accounts with role 'admin' (Admins are not companion candidates)
        const validCompanions = (compData as unknown as CompanionCardData[]).filter(
          (c) => c.profile?.role !== 'admin'
        );
        setCompanions(validCompanions);
      }

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
    async function init() {
      await fetchAdminData();
    }
    init();
  }, [fetchAdminData]);

  const handleVerifyCompanion = async (companionId: string, status: 'verified' | 'rejected') => {
    setProcessingId(companionId);
    try {
      const targetComp = companions.find((c) => c.id === companionId);
      let calculatedRate = Number(targetComp?.hourly_rate) || 0;

      // Extract rate from vehicle or bio if current rate is 0
      if (calculatedRate <= 0 && targetComp?.vehicle_model) {
        const rateMatch = targetComp.vehicle_model.match(/\[฿(\d+)\]/);
        if (rateMatch && rateMatch[1]) {
          calculatedRate = parseInt(rateMatch[1], 10);
        }
      }
      if (calculatedRate <= 0 && targetComp?.bio) {
        const rateMatch = targetComp.bio.match(/\[฿(\d+)\]/);
        if (rateMatch && rateMatch[1]) {
          calculatedRate = parseInt(rateMatch[1], 10);
        }
      }
      if (calculatedRate <= 0) {
        calculatedRate = 350;
      }

      const updateData: Record<string, unknown> = {
        verification_status: status,
        is_available: status === 'verified',
        updated_at: new Date().toISOString(),
      };

      if (status === 'verified') {
        if (!targetComp?.hourly_rate || Number(targetComp.hourly_rate) <= 0) {
          updateData.hourly_rate = calculatedRate;
        }
      }

      const { data, error } = await supabase
        .from('companion_profiles')
        .update(updateData)
        .eq('id', companionId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(
          'คำเตือน: บันทึกข้อมูลไม่สำเร็จเนื่องจากสิทธิ์ความปลอดภัย (RLS) ของ Supabase จำกัดไว้เฉพาะเจ้าของบัญชี\nกรุณารัน SQL ปลดล็อคสิทธิ์ Admin ใน Supabase SQL Editor เพื่อเปิดสิทธิ์การอนุมัติ'
        );
        return;
      }

      alert(`อัปเดตสถานะเป็น ${status === 'verified' ? 'อนุมัติและเปิดรับงานแล้ว' : 'ปฏิเสธ'} เรียบร้อย`);
      fetchAdminData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDocument = async (filePath: string, companionName = 'Companion') => {
    if (!filePath) return;

    // 1. Direct Base64 data URL or HTTP(S) URL
    if (filePath.startsWith('data:image') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
      setPreviewImageModal({ url: filePath, name: companionName });
      return;
    }

    // 2. Fallback to Supabase Storage signed URL if path is a storage object
    try {
      const { data, error } = await supabase.storage
        .from('verification_docs')
        .createSignedUrl(filePath, 120);

      if (error) throw error;
      if (data?.signedUrl) {
        setPreviewImageModal({ url: data.signedUrl, name: companionName });
      }
    } catch (err) {
      alert('ไม่สามารถเปิดรูปภาพได้: ' + (err as Error).message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'customer' | 'companion' | 'admin') => {
    if (!confirm(`ต้องการเปลี่ยนสิทธิ์ผู้ใช้นี้เป็น ${newRole} ใช่หรือไม่?`)) return;

    try {
      const updatePayload: { role: string; full_name?: string; updated_at: string } = {
        role: newRole,
        updated_at: new Date().toISOString(),
      };
      if (newRole === 'admin') {
        updatePayload.full_name = 'Admin';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
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

  const isMock = (comp: CompanionCardData) =>
    Boolean(comp.profile?.email?.endsWith('@example.com'));

  const pendingRealCount = companions.filter((c) => c.verification_status === 'pending' && !isMock(c)).length;
  const verifiedRealCount = companions.filter((c) => c.verification_status === 'verified' && (showMockData || !isMock(c))).length;
  const rejectedRealCount = companions.filter((c) => c.verification_status === 'rejected').length;

  const filteredCompanions = companions.filter((comp) => {
    if (!showMockData && isMock(comp)) return false;
    if (statusFilter === 'all') return true;
    return comp.verification_status === statusFilter;
  });

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
            <span className="text-xs font-bold text-gray-400 block mb-1">Companion จริงในระบบ</span>
            <span className="text-2xl sm:text-3xl font-black text-teal-700">
              {companions.filter((c) => !isMock(c)).length} คน
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              (+ Mock {companions.filter(isMock).length} คน)
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-amber-200 bg-amber-50/40 shadow-xs">
            <span className="text-xs font-bold text-amber-800 block mb-1">รอตรวจสอบ (Pending)</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingRealCount} คน</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              {pendingRealCount > 0 ? 'ต้องการการตรวจสอบจากแอดมิน' : 'ไม่มีรายการค้าง'}
            </span>
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
            <ScanFace className="w-4 h-4" />
            ตรวจการยืนยันตัวตน Companion ({pendingRealCount})
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
            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  รายการตรวจสอบการยืนยันตัวตน Companion
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  ตรวจสอบรูปถ่ายสแกนใบหน้าจริงและพิจารณาอนุมัติเปิดรับงาน
                </p>
              </div>

              {/* Sub-Filters & Mock Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    รอตรวจสอบ ({pendingRealCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('verified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'verified'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    อนุมัติแล้ว ({verifiedRealCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'rejected'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ปฏิเสธ ({rejectedRealCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                </div>

                {/* Mock Data Toggle */}
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={showMockData}
                    onChange={(e) => setShowMockData(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>รวม Mock ({companions.filter(isMock).length})</span>
                </label>
              </div>
            </div>

            {filteredCompanions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Companion</th>
                      <th className="px-6 py-4">เบอร์ติดต่อ</th>
                      <th className="px-6 py-4">รูปถ่ายสแกนใบหน้า</th>
                      <th className="px-6 py-4">สถานะปัจจุบัน</th>
                      <th className="px-6 py-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCompanions.map((comp) => {
                      const isProcessing = processingId === comp.id;
                      const isMockRow = isMock(comp);

                      return (
                        <tr key={comp.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <strong className="text-gray-900 block font-semibold">
                                {comp.profile?.full_name || 'ไม่ระบุชื่อ'}
                              </strong>
                              {isMockRow && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                  Mock Data
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{comp.profile?.email}</span>
                          </td>
                          <td className="px-6 py-4">{comp.profile?.phone || '-'}</td>
                          <td className="px-6 py-4">
                            {comp.id_card_image_url ? (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleViewDocument(comp.id_card_image_url!, comp.profile?.full_name || 'Companion')}
                                  className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border-2 border-teal-400 hover:border-teal-500 hover:scale-105 transition cursor-pointer shrink-0 shadow-xs group"
                                  title="คลิกเพื่อดูรูปขนาดเต็ม"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={comp.id_card_image_url}
                                    alt={comp.profile?.full_name || 'Face Scan'}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleViewDocument(comp.id_card_image_url!, comp.profile?.full_name || 'Companion')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs border border-teal-200 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  ดูรูปสแกนใบหน้า
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">ยังไม่สแกนใบหน้า</span>
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
                            {/* Pending Status: Show Approve and Reject */}
                            {comp.verification_status === 'pending' && (
                              <>
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleVerifyCompanion(comp.id, 'verified')}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer shadow-xs active:scale-95"
                                >
                                  อนุมัติ (Verify)
                                </button>
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleVerifyCompanion(comp.id, 'rejected')}
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 disabled:opacity-50 transition cursor-pointer active:scale-95"
                                >
                                  ปฏิเสธ
                                </button>
                              </>
                            )}

                            {/* Verified Status: Already verified, show badge and optional Revoke */}
                            {comp.verification_status === 'verified' && (
                              <div className="inline-flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  อนุมัติแล้ว
                                </span>
                                {!isMockRow && (
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => handleVerifyCompanion(comp.id, 'rejected')}
                                    className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-xs border border-rose-200 transition cursor-pointer"
                                  >
                                    เพิกถอน
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Rejected Status: Already rejected, show badge and optional Re-approve */}
                            {comp.verification_status === 'rejected' && (
                              <div className="inline-flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✕ ปฏิเสธแล้ว
                                </span>
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleVerifyCompanion(comp.id, 'verified')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition cursor-pointer"
                                >
                                  อนุมัติใหม่
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <p className="text-gray-500 font-semibold text-sm">
                  {statusFilter === 'pending'
                    ? 'ไม่มีรายการ Companion ที่รอการตรวจสอบในขณะนี้ ✨'
                    : 'ไม่มีข้อมูล Companion ในหมวดหมู่นี้'}
                </p>
                <p className="text-xs text-gray-400">
                  {statusFilter === 'pending'
                    ? 'เมื่อมีผู้สมัครรายใหม่ที่สแกนใบหน้าและยืนยันเบอร์แล้ว รายการจะแสดงขึ้นที่นี่'
                    : 'คุณสามารถเลือกฟิลเตอร์อื่นหรือเปิดแสดง Mock Data ด้านบนได้'}
                </p>
              </div>
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
                        {u.role === 'admin' ? 'Admin' : (u.full_name || 'ผู้ใช้งาน')}
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

        {/* Modal: Preview Full Face Scan Image */}
        {previewImageModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    รูปถ่ายยืนยันตัวตน (สแกนใบหน้า)
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{previewImageModal.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border border-gray-200 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageModal.url}
                  alt={previewImageModal.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
