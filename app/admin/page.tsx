'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { Profile, CompanionCardData, BookingDetailData, ReportDetailData } from '@/types/database';
import { formatPrice, formatThaiDate, getStatusBadgeInfo } from '@/lib/utils';
import { Users, Calendar, AlertTriangle, Eye, ScanFace, CheckCircle2, Flag, Phone, Mail, ShieldAlert, ShieldCheck, User, MessageSquare, X, Clock, MapPin, Navigation, Car, Bike, FileText, ExternalLink, Star, Briefcase, Award, Shield, Sparkles } from 'lucide-react';
import { extractCleanBio, parseVehiclesList } from '@/lib/vehicleUtils';
import Swal from 'sweetalert2';
import { addSystemNotification } from '@/lib/notifications';

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'reports' | 'users' | 'bookings'>('verification');

  const [companions, setCompanions] = useState<CompanionCardData[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [users, setUsers] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<BookingDetailData[]>([]);
  const [reports, setReports] = useState<ReportDetailData[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');

  // Modal for resolving/managing a report
  const [selectedReportForAction, setSelectedReportForAction] = useState<ReportDetailData | null>(null);
  const [actionDecision, setActionDecision] = useState<'warning' | 'suspend' | 'reactivate' | 'dismiss'>('warning');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [savingReportAction, setSavingReportAction] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<BookingDetailData | null>(null);
  const [selectedCompanionForDetails, setSelectedCompanionForDetails] = useState<CompanionCardData | null>(null);

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
          customer:profiles!bookings_customer_id_fkey(full_name, avatar_url, phone, emergency_phone, email),
          companion:profiles!bookings_companion_id_fkey(full_name, avatar_url, phone, email),
          category:service_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (bookingData) setBookings(bookingData as unknown as BookingDetailData[]);

      // 4. Fetch all reports
      const { data: reportData } = await supabase
        .from('reports')
        .select(`
          *,
          customer:profiles!reports_customer_id_fkey(full_name, phone, email, avatar_url),
          companion:profiles!reports_companion_id_fkey(full_name, phone, email, avatar_url),
          booking:bookings!reports_booking_id_fkey(id, appointment_date, errand_title, total_price, status)
        `)
        .order('created_at', { ascending: false });

      if (reportData) setReports(reportData as unknown as ReportDetailData[]);
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

      // Add in-app notification for the companion
      if (status === 'verified') {
        addSystemNotification(companionId, {
          id: `comp-verif-verified-${companionId}-${Date.now()}`,
          type: 'verification_approved',
          title: 'ยินดีด้วย! บัญชีได้รับการอนุมัติแล้ว 🎉',
          message:
            'บัญชี Companion ของคุณผ่านการตรวจสอบจากผู้ดูแลระบบเรียบร้อยแล้ว คุณสามารถเปิดรับงานและให้บริการลูกค้าได้ทันที',
          link: '/companion/dashboard',
        });
      } else {
        addSystemNotification(companionId, {
          id: `comp-verif-rejected-${companionId}-${Date.now()}`,
          type: 'verification_rejected',
          title: 'ผลการตรวจสอบข้อมูลการสมัคร',
          message:
            'ข้อมูลการสมัคร Companion ของคุณไม่ผ่านการอนุมัติ กรุณาตรวจสอบข้อมูลและเอกสารในหน้าจัดการโปรไฟล์ และส่งข้อมูลใหม่อีกครั้ง',
          link: '/companion/profile',
        });
      }

      // Broadcast update event across tabs/windows
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('carecompanion_notification_update', {
            detail: { companionId, status },
          })
        );
      }

      alert(`อัปเดตสถานะเป็น ${status === 'verified' ? 'อนุมัติและเปิดรับงานแล้ว' : 'ปฏิเสธ'} เรียบร้อย (ส่งแจ้งเตือนไปยังผู้สมัครแล้ว)`);
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

  const handleResolveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForAction) return;

    setSavingReportAction(true);
    try {
      const companionId = selectedReportForAction.companion_id;
      const comp = companions.find((c) => c.id === companionId);

      if (actionDecision === 'warning') {
        const newCount = (comp?.warning_count || 0) + 1;
        const { error: compErr } = await supabase
          .from('companion_profiles')
          .update({ warning_count: newCount, updated_at: new Date().toISOString() })
          .eq('id', companionId);
        if (compErr) throw compErr;

        const { error: repErr } = await supabase
          .from('reports')
          .update({
            status: 'resolved',
            admin_notes: adminNoteInput.trim() || 'ตักเตือนผู้ช่วยและบันทึกข้อตกลงปรับปรุงตัวเรียบร้อยแล้ว',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedReportForAction.id);
        if (repErr) throw repErr;
      } else if (actionDecision === 'suspend') {
        const { error: compErr } = await supabase
          .from('companion_profiles')
          .update({
            is_suspended: true,
            is_available: false,
            suspension_reason: suspensionReasonInput.trim() || 'ถูกพักการให้บริการชั่วคราวเนื่องจากข้อร้องเรียน',
            updated_at: new Date().toISOString(),
          })
          .eq('id', companionId);
        if (compErr) throw compErr;

        const { error: repErr } = await supabase
          .from('reports')
          .update({
            status: 'investigating',
            admin_notes: adminNoteInput.trim() || 'ระงับบัญชีชั่วคราวเพื่อรอการตรวจสอบเพิ่มเติม',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedReportForAction.id);
        if (repErr) throw repErr;
      } else if (actionDecision === 'reactivate') {
        const { error: compErr } = await supabase
          .from('companion_profiles')
          .update({
            is_suspended: false,
            is_available: true,
            suspension_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companionId);
        if (compErr) throw compErr;

        const { error: repErr } = await supabase
          .from('reports')
          .update({
            status: 'resolved',
            admin_notes: adminNoteInput.trim() || 'พูดคุยตกลงเรียบร้อย ผู้ช่วยยินดีปรับปรุงตัว จึงปลดการระงับบัญชี',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedReportForAction.id);
        if (repErr) throw repErr;
      } else if (actionDecision === 'dismiss') {
        const { error: repErr } = await supabase
          .from('reports')
          .update({
            status: 'dismissed',
            admin_notes: adminNoteInput.trim() || 'ยกเลิกรายงานเนื่องจากข้อมูลไม่สอดคล้องหรือไม่พบความผิด',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedReportForAction.id);
        if (repErr) throw repErr;
      }

      await Swal.fire({
        title: 'บันทึกผลการพิจารณาสำเร็จ',
        text: 'ระบบได้อัปเดตสถานะของผู้ช่วยและบันทึกผลการรายงานเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'rounded-3xl shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        },
      });

      setSelectedReportForAction(null);
      setAdminNoteInput('');
      setSuspensionReasonInput('');
      fetchAdminData();
    } catch (err) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: (err as Error).message,
        icon: 'error',
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setSavingReportAction(false);
    }
  };

  const handleToggleCompanionSuspension = async (companion: CompanionCardData) => {
    const isCurrentlySuspended = Boolean(companion.is_suspended);
    const actionText = isCurrentlySuspended ? 'ปลดการระงับบัญชี' : 'ระงับการให้บริการชั่วคราว';

    const result = await Swal.fire({
      title: `ต้องการ${actionText}ใช่หรือไม่?`,
      text: isCurrentlySuspended
        ? `เมื่อปลดระงับ โปรไฟล์ของ ${companion.profile?.full_name || 'ผู้ช่วย'} จะกลับไปแสดงในหน้าค้นหา และสามารถรับงานได้ตามปกติ`
        : `เมื่อระงับ โปรไฟล์ของ ${companion.profile?.full_name || 'ผู้ช่วย'} จะถูกซ่อน และจะไม่สามารถรับงานใหม่ได้จนกว่าจะปลดระงับ`,
      icon: isCurrentlySuspended ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isCurrentlySuspended ? '#059669' : '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: `ใช่, ${actionText}`,
      cancelButtonText: 'ยกเลิก',
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
        .from('companion_profiles')
        .update({
          is_suspended: !isCurrentlySuspended,
          is_available: isCurrentlySuspended,
          suspension_reason: !isCurrentlySuspended ? 'ถูกระงับการให้บริการชั่วคราวโดยผู้ดูแลระบบ' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companion.id);

      if (error) throw error;

      await Swal.fire({
        title: `${actionText}สำเร็จ`,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'ตกลง',
      });

      fetchAdminData();
    } catch (err) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: (err as Error).message,
        icon: 'error',
      });
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

  // เฉพาะ Companion ที่กดส่ง/บันทึกข้อมูลเรียบร้อยแล้วเท่านั้น (มี Bio และรายละเอียดครบถ้วน ไม่ใช่แค่กดสมัครแล้วยังไม่ได้กรอกข้อมูล)
  const isProfileSubmitted = (comp: CompanionCardData) => {
    const hasBio = Boolean(comp.bio && comp.bio.trim().length > 0);
    const hasDetails = Boolean(
      (comp.hourly_rate && Number(comp.hourly_rate) > 0) ||
      (comp.id_card_image_url && comp.id_card_image_url.trim().length > 0)
    );
    return hasBio && hasDetails;
  };

  const pendingRealCount = companions.filter(
    (c) => c.verification_status === 'pending' && !isMock(c) && isProfileSubmitted(c)
  ).length;
  const verifiedRealCount = companions.filter((c) => c.verification_status === 'verified' && !isMock(c)).length;
  const rejectedRealCount = companions.filter(
    (c) => c.verification_status === 'rejected' && !isMock(c) && isProfileSubmitted(c)
  ).length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length;

  const filteredCompanions = companions.filter((comp) => {
    if (isMock(comp)) return false;
    // กรองโปรไฟล์ร่างที่ยังไม่ได้กดส่ง/บันทึกข้อมูลออก เพื่อไม่ให้แสดงในรายการตรวจสอบ
    if (!isProfileSubmitted(comp)) return false;
    if (statusFilter === 'all') return true;
    return comp.verification_status === statusFilter;
  });

  const filteredReports = reports.filter((r) => {
    if (reportStatusFilter === 'all') return true;
    return r.status === reportStatusFilter;
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
              ภาพรวมผู้ดูแลระบบ (Admin)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              บริหารจัดการผู้ใช้งาน อนุมัติเอกสาร Companion ตรวจสอบข้อร้องเรียน และติดตามความเรียบร้อยของแพลตฟอร์ม
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">ผู้ใช้ทั้งหมด</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{users.length} คน</span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">Companion ในระบบ</span>
            <span className="text-2xl sm:text-3xl font-black text-teal-700">
              {companions.filter((c) => !isMock(c) && isProfileSubmitted(c)).length} คน
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-200 bg-amber-50/40 shadow-xs">
            <span className="text-xs font-bold text-amber-800 block mb-1">รอตรวจยืนยันตัวตน</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingRealCount} คน</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              {pendingRealCount > 0 ? 'ต้องการการตรวจสอบจากแอดมิน' : 'ไม่มีรายการค้าง'}
            </span>
          </div>

          <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border ${
            pendingReportsCount > 0 ? 'border-rose-300 bg-rose-50/40' : 'border-gray-200/80'
          }`}>
            <span className={`text-xs font-bold block mb-1 ${pendingReportsCount > 0 ? 'text-rose-800' : 'text-gray-400'}`}>
              ข้อร้องเรียน & รายงาน
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${pendingReportsCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {pendingReportsCount} เรื่อง
            </span>
            <span className={`text-[10px] block mt-0.5 ${pendingReportsCount > 0 ? 'text-rose-700 font-semibold' : 'text-gray-400'}`}>
              {pendingReportsCount > 0 ? 'รอแอดมินตรวจสอบ & พูดคุย' : 'ไม่มีเรื่องร้องเรียนค้าง'}
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
            <span className="text-xs font-bold text-gray-400 block mb-1">การจองทั้งหมด</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{bookings.length} รายการ</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            ตรวจการยืนยันตัวตน Companion ({pendingRealCount})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            ข้อร้องเรียน & รายงาน ({pendingReportsCount})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
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
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
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
                              <button
                                type="button"
                                onClick={() => setSelectedCompanionForDetails(comp)}
                                className="text-left font-bold text-gray-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5 transition cursor-pointer group"
                                title="คลิกเพื่อดูข้อมูลผู้สมัครและรายละเอียดการให้บริการทั้งหมด"
                              >
                                <span className="group-hover:text-emerald-700">{comp.profile?.full_name || 'ไม่ระบุชื่อ'}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition" />
                              </button>
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
                          <td className="px-6 py-4 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  comp.verification_status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : comp.verification_status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {comp.verification_status}
                              </span>

                              {comp.is_suspended && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                                  🔴 ระงับชั่วคราว
                                </span>
                              )}

                              {Boolean(comp.warning_count && comp.warning_count > 0) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⚠️ เตือน {comp.warning_count} ครั้ง
                                </span>
                              )}
                            </div>

                            {/* Companion Rating */}
                            {(comp.rating_count ?? 0) > 0 ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className={`font-bold flex items-center gap-0.5 ${
                                  Number(comp.rating_avg) < 3.0 ? 'text-rose-600' : 'text-amber-600'
                                }`}>
                                  ⭐ {Number(comp.rating_avg).toFixed(1)} / 5.0
                                </span>
                                <span className="text-[11px] text-gray-400">({comp.rating_count} รีวิว)</span>
                                {Number(comp.rating_avg) < 3.0 && (
                                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-sm">
                                    ดาวต่ำกว่าเกณฑ์
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  ผู้สมัครใหม่ (ยังไม่มีรีวิว)
                                </span>
                              </div>
                            )}
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

                            {/* Verified Status: Already verified, show badge and optional Revoke & Suspend */}
                            {comp.verification_status === 'verified' && (
                              <div className="inline-flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  อนุมัติแล้ว
                                </span>
                                {!isMockRow && (
                                  <>
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleToggleCompanionSuspension(comp)}
                                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition cursor-pointer ${
                                        comp.is_suspended
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                      }`}
                                    >
                                      {comp.is_suspended ? 'ปลดระงับ' : 'ระงับชั่วคราว'}
                                    </button>
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleVerifyCompanion(comp.id, 'rejected')}
                                      className="px-2.5 py-1 rounded-lg text-gray-500 hover:bg-gray-100 font-semibold text-xs border border-gray-200 transition cursor-pointer"
                                    >
                                      เพิกถอน
                                    </button>
                                  </>
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
                    ? 'เมื่อมีผู้สมัครรายใหม่กรอกข้อมูลครบถ้วนและกดส่งข้อมูลเข้ามา รายการจะแสดงขึ้นที่นี่'
                    : 'คุณสามารถเลือกฟิลเตอร์อื่นหรือเปิดแสดง Mock Data ด้านบนได้'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Reports & Complaints */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs space-y-0">
            {/* Header & Filter Bar */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ข้อร้องเรียนและรายงานผู้ช่วย (Companion Reports)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  ตรวจสอบรายงานจากลูกค้า ติดต่อพูดคุยกับผู้ช่วยทางโทรศัพท์ และพิจารณาตักเตือนหรือระงับบัญชี
                </p>
              </div>

              {/* Sub-Filters for Reports */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                  {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReportStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                        reportStatusFilter === st
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {st === 'all' && `ทั้งหมด (${reports.length})`}
                      {st === 'pending' && `รอตรวจสอบ (${reports.filter((r) => r.status === 'pending').length})`}
                      {st === 'investigating' && `กำลังตรวจ (${reports.filter((r) => r.status === 'investigating').length})`}
                      {st === 'resolved' && `เสร็จสิ้น (${reports.filter((r) => r.status === 'resolved').length})`}
                      {st === 'dismissed' && `ยกเลิกแล้ว (${reports.filter((r) => r.status === 'dismissed').length})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reports List */}
            {filteredReports.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const comp = companions.find((c) => c.id === report.companion_id);
                  const isSuspended = comp?.is_suspended;
                  const warningCount = comp?.warning_count || 0;
                  const ratingAvg = comp?.rating_avg || 5.0;

                  return (
                    <div key={report.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition space-y-4">
                      {/* Top Row: Companion + Reporter + Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden shrink-0 border border-emerald-200">
                            {report.companion?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={report.companion.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-emerald-700" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-base font-bold text-gray-900">
                                {report.companion?.full_name || 'ผู้ช่วย'}
                              </strong>
                              {isSuspended && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                                  🔴 บัญชีถูกระงับ
                                </span>
                              )}
                              {warningCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⚠️ เคยเตือน {warningCount} ครั้ง
                                </span>
                              )}
                              {(comp?.rating_count ?? 0) > 0 ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  Number(ratingAvg) < 3.0 ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  ⭐ {Number(ratingAvg).toFixed(1)} / 5.0
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500">
                                  ยังไม่มีรีวิว
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 block mt-0.5">
                              รายงานโดยลูกค้า: <strong>{report.customer?.full_name || 'ลูกค้า'}</strong> ({report.customer?.phone || report.customer?.email})
                            </span>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : report.status === 'investigating'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {report.status === 'pending' && '⏳ รอตรวจสอบ'}
                            {report.status === 'investigating' && '🔍 กำลังตรวจสอบ / ระงับชั่วคราว'}
                            {report.status === 'resolved' && '✅ เสร็จสิ้นแล้ว'}
                            {report.status === 'dismissed' && '✕ ยกเลิกรายงาน'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatThaiDate(report.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Reason & Details */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/70 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                            สาเหตุ: {report.reason}
                          </span>
                          {report.booking && (
                            <span className="text-xs text-gray-500">
                              (งาน: #{report.booking.id.slice(0, 8)} - {report.booking.errand_title})
                            </span>
                          )}
                        </div>
                        {report.details ? (
                          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed pl-1">
                            {report.details}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic pl-1">ไม่มีรายละเอียดเพิ่มเติมระบุไว้</p>
                        )}

                        {/* Admin Notes if present */}
                        {report.admin_notes && (
                          <div className="pt-2 border-t border-gray-200 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                            <strong>📝 บันทึกผลจากแอดมิน:</strong> {report.admin_notes}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Bar: Contact & Resolve */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* Quick Contact Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {report.companion?.phone ? (
                            <a
                              href={`tel:${report.companion.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              โทรหาผู้ช่วย ({report.companion.phone})
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">ไม่มีเบอร์โทร</span>
                          )}

                          {report.companion?.email && (
                            <a
                              href={`mailto:${report.companion.email}?subject=ข้อร้องเรียนการให้บริการ CareCompanion`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold border border-gray-200 transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              ส่งอีเมล
                            </a>
                          )}
                        </div>

                        {/* Resolution Trigger */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportForAction(report);
                              setActionDecision(isSuspended ? 'reactivate' : 'warning');
                              setAdminNoteInput(report.admin_notes || '');
                              setSuspensionReasonInput(comp?.suspension_reason || '');
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            บันทึกผลการพูดคุย & ดำเนินการ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-gray-700 font-bold text-base">
                  ไม่มีข้อร้องเรียนในหมวดนี้ ✨
                </p>
                <p className="text-xs text-gray-400">
                  ระบบจะแสดงข้อร้องเรียนเมื่อมีลูกค้าส่งรายงานหรือให้คะแนนรีวิว 1-2 ดาว
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
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        ยังไม่มีรายการจองในระบบ
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const statusInfo = getStatusBadgeInfo(b.status);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForDetails(b)}
                              className="text-left font-bold text-gray-900 hover:text-emerald-700 hover:underline transition flex items-center gap-1.5 cursor-pointer group"
                              title="คลิกเพื่อดูรายละเอียดการจองทั้งหมด"
                            >
                              <span className="group-hover:text-emerald-700">{b.errand_title}</span>
                              <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition shrink-0" />
                            </button>
                            <span className="text-xs text-gray-400 block mt-0.5">
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
                    })
                  )}
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

        {/* Modal: Record Admin Discussion & Action Resolution */}
        {selectedReportForAction && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedReportForAction(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                      จัดการข้อร้องเรียน & บันทึกผลการพูดคุย
                    </h3>
                    <p className="text-xs text-gray-500">
                      ผู้ช่วย: <strong className="text-gray-800">{selectedReportForAction.companion?.full_name || 'ผู้ช่วย'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReportForAction(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleResolveReportSubmit} className="space-y-4">
                {/* Decision Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    ผลการพิจารณา / การดำเนินการ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                    <label className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition ${
                      actionDecision === 'warning'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="actionDecision"
                        value="warning"
                        checked={actionDecision === 'warning'}
                        onChange={() => setActionDecision('warning')}
                        className="text-amber-600"
                      />
                      <span>ตักเตือน (คงสถานะปกติ)</span>
                    </label>

                    <label className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition ${
                      actionDecision === 'suspend'
                        ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-xs'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="actionDecision"
                        value="suspend"
                        checked={actionDecision === 'suspend'}
                        onChange={() => setActionDecision('suspend')}
                        className="text-rose-600"
                      />
                      <span>ระงับการให้บริการชั่วคราว</span>
                    </label>

                    <label className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition ${
                      actionDecision === 'reactivate'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="actionDecision"
                        value="reactivate"
                        checked={actionDecision === 'reactivate'}
                        onChange={() => setActionDecision('reactivate')}
                        className="text-emerald-600"
                      />
                      <span>ปลดการระงับ (กลับมารับงาน)</span>
                    </label>

                    <label className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition ${
                      actionDecision === 'dismiss'
                        ? 'border-gray-400 bg-gray-100 text-gray-900 shadow-xs'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="actionDecision"
                        value="dismiss"
                        checked={actionDecision === 'dismiss'}
                        onChange={() => setActionDecision('dismiss')}
                        className="text-gray-600"
                      />
                      <span>ยกเลิกรายงาน (ไม่พบความผิด)</span>
                    </label>
                  </div>
                </div>

                {/* Suspension Reason (if suspend selected) */}
                {actionDecision === 'suspend' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      เหตุผลที่ระงับ (จะแสดงแจ้งเตือนในแดชบอร์ดของ Companion)
                    </label>
                    <input
                      type="text"
                      value={suspensionReasonInput}
                      onChange={(e) => setSuspensionReasonInput(e.target.value)}
                      placeholder="เช่น อยู่ระหว่างตรวจสอบข้อร้องเรียนเรื่องการคิดเงินเกินจริง..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    บันทึกสรุปผลการพูดคุยกับผู้ช่วย (Admin Notes) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="บันทึกรายละเอียด เช่น โทรคุยกับผู้ช่วยแล้ว ผู้ช่วยชี้แจงว่า... และยินดีปรับปรุงตัวต่อไป..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none font-medium"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReportForAction(null)}
                    disabled={savingReportAction}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={savingReportAction}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingReportAction ? 'กำลังบันทึก...' : 'บันทึกผลการพิจารณา'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: View Full Booking Details for Admin */}
        {selectedBookingForDetails && (() => {
          const b = selectedBookingForDetails;
          const statusInfo = getStatusBadgeInfo(b.status);
          const companionProfile = companions.find((c) => c.id === b.companion_id);

          return (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setSelectedBookingForDetails(null)}
            >
              <div
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bgColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                        {b.category?.name && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {b.category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">
                          ID: #{b.id.slice(0, 8)}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 leading-tight">
                        {b.errand_title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDetails(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer shrink-0"
                    title="ปิดหน้าต่าง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Section 1: Errand Details & Description */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    รายละเอียดธุระที่ต้องทำ
                  </h4>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {b.errand_details || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}
                  </p>
                </div>

                {/* Section 2: Parties Involved (Customer & Companion) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Card */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        ผู้จอง (Customer)
                      </span>
                      <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                        ลูกค้า
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {b.customer?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.customer.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <strong className="block text-sm text-gray-900 truncate">
                          {b.customer?.full_name || 'ลูกค้า'}
                        </strong>
                        {b.customer?.phone && (
                          <a
                            href={`tel:${b.customer.phone}`}
                            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{b.customer.phone}</span>
                          </a>
                        )}
                        {b.customer?.email && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{b.customer.email}</span>
                          </p>
                        )}
                        {b.customer?.emergency_phone && (
                          <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg px-2 py-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>เบอร์ฉุกเฉิน: <strong>{b.customer.emergency_phone}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Companion Card */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        ผู้ช่วย (Companion)
                      </span>
                      <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-semibold">
                        ผู้ให้บริการ
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {b.companion?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.companion.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <strong className="block text-sm text-gray-900 truncate">
                          {b.companion?.full_name || 'ผู้ช่วย'}
                        </strong>
                        {b.companion?.phone && (
                          <a
                            href={`tel:${b.companion.phone}`}
                            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{b.companion.phone}</span>
                          </a>
                        )}
                        {b.companion?.email && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{b.companion.email}</span>
                          </p>
                        )}
                        {companionProfile && (
                          <div className="mt-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-200/60 rounded-lg px-2 py-1 space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-gray-700">
                              {companionProfile.vehicle_type === 'car' ? (
                                <Car className="w-3 h-3 text-emerald-600" />
                              ) : companionProfile.vehicle_type === 'motorcycle' ? (
                                <Bike className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <span className="text-xs">🚶</span>
                              )}
                              <span>
                                {companionProfile.vehicle_type === 'car'
                                  ? 'รถยนต์'
                                  : companionProfile.vehicle_type === 'motorcycle'
                                  ? 'รถจักรยานยนต์'
                                  : 'ไม่มีพาหนะ / ขนส่งสาธารณะ'}
                              </span>
                            </div>
                            {(companionProfile.vehicle_model || companionProfile.vehicle_plate) && (
                              <p className="text-[10px] text-gray-500 truncate">
                                {companionProfile.vehicle_model} {companionProfile.vehicle_plate ? `(${companionProfile.vehicle_plate})` : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Route & Navigation */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      เส้นทาง & สถานที่
                    </h4>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                        b.origin_address
                      )}&destination=${encodeURIComponent(b.destination_address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      เปิดดูใน Google Maps
                    </a>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-gray-100">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-700 block">
                          จุดรับ (ต้นทาง)
                        </span>
                        <p className="font-semibold text-gray-900 mt-0.5">{b.origin_address}</p>
                        {(b.origin_lat || b.origin_lng) && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            พิกัด: {b.origin_lat?.toFixed(5)}, {b.origin_lng?.toFixed(5)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-gray-100">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-rose-700 block">
                          จุดส่ง (ปลายทาง)
                        </span>
                        <p className="font-semibold text-gray-900 mt-0.5">{b.destination_address}</p>
                        {(b.destination_lat || b.destination_lng) && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            พิกัด: {b.destination_lat?.toFixed(5)}, {b.destination_lng?.toFixed(5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Schedule, Duration & Special Needs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      กำหนดการนัดหมาย
                    </h4>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>วันที่: <strong className="text-gray-900">{formatThaiDate(b.appointment_date)}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>เวลา: <strong className="text-gray-900">{b.start_time?.slice(0, 5)} น.</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ความต้องการพิเศษ / ข้อควรระวัง
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                      {b.special_needs || 'ไม่มีระบุความต้องการพิเศษ'}
                    </p>
                  </div>
                </div>

                {/* Section 5: Pricing & System Metadata */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-gray-500 block">ยอดรวมค่าบริการทั้งหมด</span>
                    <strong className="text-2xl font-black text-emerald-700">
                      {formatPrice(b.total_price)}
                    </strong>
                  </div>
                  <div className="text-xs text-gray-400 text-left sm:text-right space-y-0.5">
                    <p>สร้างคำขอเมื่อ: {formatThaiDate(b.created_at)}</p>
                    <p className="font-mono text-[11px]">Booking ID: {b.id}</p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDetails(null)}
                    className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal: View Full Companion Application Details for Admin */}
        {selectedCompanionForDetails && (() => {
          const comp = selectedCompanionForDetails;
          const { cleanBio, embeddedSchedule } = extractCleanBio(comp.bio);
          const vehicles = parseVehiclesList(
            comp.bio,
            comp.vehicle_type,
            comp.vehicle_model,
            comp.vehicle_plate,
            comp.hourly_rate
          );
          const isProcessing = processingId === comp.id;

          return (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setSelectedCompanionForDetails(null)}
            >
              <div
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-emerald-200 shadow-xs">
                      {comp.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comp.profile.avatar_url}
                          alt={comp.profile?.full_name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            comp.verification_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : comp.verification_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {comp.verification_status === 'verified' && '✓ อนุมัติแล้ว'}
                          {comp.verification_status === 'rejected' && '✕ ปฏิเสธแล้ว'}
                          {comp.verification_status === 'pending' && '⏳ รอตรวจสอบ'}
                        </span>

                        {(comp.rating_count ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            ⭐ {Number(comp.rating_avg).toFixed(1)} ({comp.rating_count} รีวิว)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            🌱 ผู้สมัครใหม่ (ยังไม่มีรีวิว)
                          </span>
                        )}

                        {comp.is_suspended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                            🔴 ระงับบัญชี
                          </span>
                        )}
                        {Boolean(comp.warning_count && comp.warning_count > 0) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚠️ เตือน {comp.warning_count} ครั้ง
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 leading-tight">
                        {comp.profile?.full_name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        {comp.profile?.phone && (
                          <a
                            href={`tel:${comp.profile.phone}`}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {comp.profile.phone}
                          </a>
                        )}
                        {comp.profile?.email && (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <Mail className="w-3 h-3" />
                            {comp.profile.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanionForDetails(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer shrink-0"
                    title="ปิดหน้าต่าง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Section 1: Face Scan Verification & Phone */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                    หลักฐานการยืนยันตัวตน (Face Scan & Phone)
                  </h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {comp.id_card_image_url ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleViewDocument(comp.id_card_image_url!, comp.profile?.full_name || 'Companion')}
                          className="w-20 h-20 rounded-2xl bg-white overflow-hidden border-2 border-teal-500 hover:border-teal-600 hover:scale-105 transition cursor-pointer shrink-0 shadow-md group relative"
                          title="คลิกเพื่อดูรูปขนาดเต็ม"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={comp.id_card_image_url}
                            alt="Face Scan"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </button>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            มีรูปถ่ายสแกนใบหน้าจริง
                          </p>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(comp.id_card_image_url!, comp.profile?.full_name || 'Companion')}
                            className="text-xs text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            คลิกดูรูปสแกนใบหน้าขนาดเต็ม
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ผู้สมัครยังไม่ได้อัปโหลดรูปถ่ายสแกนใบหน้าจริง</span>
                      </div>
                    )}

                    <div className="sm:ml-auto space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">การยืนยันเบอร์โทร:</span>
                        {comp.phone_verified ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ยืนยัน OTP แล้ว
                          </span>
                        ) : (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ยังไม่ยืนยัน OTP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        อัปเดตล่าสุด: {formatThaiDate(comp.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Bio, Experience, Hourly Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      คำแนะนำตัว (Bio)
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {cleanBio || 'ไม่ได้ระบุคำแนะนำตัว'}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block font-semibold mb-1">ประสบการณ์ทำงาน</span>
                      <strong className="text-xl font-bold text-gray-900 flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        {comp.experience_years || 0} ปี
                      </strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-xs text-gray-500 block font-semibold mb-1">ค่าบริการพื้นฐาน</span>
                      <strong className="text-xl font-black text-emerald-700">
                        {formatPrice(comp.hourly_rate)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section 3: Vehicles */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-emerald-600" />
                    ยานพาหนะที่ใช้ให้บริการ ({vehicles.length} คัน)
                  </h4>
                  {vehicles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {vehicles.map((v, i) => (
                        <div key={v.id || i} className="bg-white rounded-xl p-3 border border-gray-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              {v.type === 'car' ? (
                                <Car className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Bike className="w-3.5 h-3.5 text-teal-600" />
                              )}
                              {v.type === 'car' ? 'รถยนต์' : 'รถจักรยานยนต์'}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              ฿{v.rate}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium">{v.model || 'ไม่ระบุรุ่น'}</p>
                          <p className="text-[11px] text-gray-400 font-mono">ทะเบียน: {v.plate || '-'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      ไม่มีพาหนะส่วนตัว (ให้บริการเดินทางด้วยระบบขนส่งสาธารณะหรือเดินเท้า)
                    </p>
                  )}
                </div>

                {/* Section 4: Schedule */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    วันและเวลาที่สะดวกให้บริการ
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium">
                    {comp.available_schedule || embeddedSchedule || 'ไม่ระบุช่วงเวลาให้บริการ'}
                  </p>
                </div>

                {/* Section 5: Skills & Service Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ทักษะและความสามารถ ({comp.skills?.length || 0})
                    </h4>
                    {comp.skills && comp.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {comp.skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">ไม่ได้ระบุทักษะ</p>
                    )}
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      พื้นที่ให้บริการ ({comp.service_areas?.length || 0})
                    </h4>
                    {comp.service_areas && comp.service_areas.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {comp.service_areas.map((a, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">ไม่ได้ระบุพื้นที่</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCompanionForDetails(null)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {comp.verification_status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={async () => {
                            await handleVerifyCompanion(comp.id, 'verified');
                            setSelectedCompanionForDetails(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer shadow-xs active:scale-95"
                        >
                          ✓ อนุมัติ (Verify)
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={async () => {
                            await handleVerifyCompanion(comp.id, 'rejected');
                            setSelectedCompanionForDetails(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 disabled:opacity-50 transition cursor-pointer active:scale-95"
                        >
                          ✕ ปฏิเสธ
                        </button>
                      </>
                    )}

                    {comp.verification_status === 'verified' && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={async () => {
                            await handleToggleCompanionSuspension(comp);
                            setSelectedCompanionForDetails(null);
                          }}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                            comp.is_suspended
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {comp.is_suspended ? 'ปลดระงับบัญชี' : 'ระงับบัญชีชั่วคราว'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={async () => {
                            await handleVerifyCompanion(comp.id, 'rejected');
                            setSelectedCompanionForDetails(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 disabled:opacity-50 transition cursor-pointer"
                        >
                          เพิกถอนสิทธิ์
                        </button>
                      </>
                    )}

                    {comp.verification_status === 'rejected' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={async () => {
                          await handleVerifyCompanion(comp.id, 'verified');
                          setSelectedCompanionForDetails(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                      >
                        อนุมัติใหม่
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
}
