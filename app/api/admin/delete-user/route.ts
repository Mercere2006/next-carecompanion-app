import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้ระบุรหัสผู้ใช้งาน (userId)' },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบสิทธิ์ว่าผู้เรียกใช้งานเป็น Admin ในระบบจริงหรือไม่
    const supabase = await createClient();
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'การเข้าถึงถูกปฏิเสธ: ต้องเป็น Admin เท่านั้น' },
        { status: 403 }
      );
    }

    if (currentUser.id === userId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบของตนเองได้' },
        { status: 400 }
      );
    }

    // 2. วิธีที่ 1: เรียกใช้ Database RPC admin_delete_user (SECURITY DEFINER)
    // วิธีนี้สามารถลบ cascade ทุกตารางและลบออกจาก auth.users ได้โดยตรง
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      });

      if (!rpcError && rpcData?.success) {
        return NextResponse.json({
          success: true,
          method: 'rpc',
          message: rpcData.message || 'ลบบัญชีผู้ใช้และข้อมูลทั้งหมดเรียบร้อยแล้ว',
          details: rpcData.details,
        });
      }

      if (rpcError && rpcError.code !== 'PGRST202') {
        console.warn('RPC admin_delete_user error:', rpcError);
      }
    } catch (rpcErr) {
      console.warn('Failed executing RPC admin_delete_user:', rpcErr);
    }

    // 3. วิธีที่ 2: ใช้ Service Role Key (หากมีการกำหนดค่าใน environment)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/rest\/v1\/?$/, '');

    if (serviceRoleKey && supabaseUrl) {
      try {
        const adminClient = createAdminSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 3.1 ลบข้อมูลตารางลูกทั้งหมด
        await adminClient.from('reviews').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
        await adminClient.from('reports').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
        await adminClient.from('bookings').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
        await adminClient.from('companion_profiles').delete().eq('id', userId);
        const { error: profDelErr } = await adminClient.from('profiles').delete().eq('id', userId);

        // 3.2 ลบ Authentication User ออกจาก auth.users
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(userId);

        if (!profDelErr && !authDelErr) {
          return NextResponse.json({
            success: true,
            method: 'service_role',
            message: 'ลบบัญชีและข้อมูลทั้งหมดเรียบร้อยแล้ว (ผ่าน Service Role)',
          });
        }
      } catch (serviceErr) {
        console.warn('Failed deleting via service role:', serviceErr);
      }
    }

    // 4. วิธีที่ 3: ลบผ่าน Client Session (หากรัน SQL Policy ให้ Admin มีสิทธิ์ DELETE บน profiles แล้ว)
    try {
      await supabase.from('reviews').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
      await supabase.from('reports').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
      await supabase.from('bookings').delete().or(`customer_id.eq.${userId},companion_id.eq.${userId}`);
      await supabase.from('companion_profiles').delete().eq('id', userId);
      const { error: directProfErr } = await supabase.from('profiles').delete().eq('id', userId);

      // ตรวจสอบว่าแถวใน profiles ถูกลบออกจริงหรือไม่
      const { data: remainingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!remainingProfile) {
        return NextResponse.json({
          success: true,
          method: 'client_session',
          message: 'ลบข้อมูลโปรไฟล์และข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว',
        });
      }

      if (directProfErr) {
        console.error('Direct profile deletion error:', directProfErr);
      }
    } catch (directErr) {
      console.error('Failed direct deletion:', directErr);
    }

    // 5. หากทุกวิธีไม่สำเร็จ แสดงว่าต้องรัน SQL Migration ใน Supabase Dashboard
    return NextResponse.json(
      {
        success: false,
        error:
          'ไม่สามารถลบบัญชีได้เนื่องจากติดข้อจำกัดของสิทธิ์ฐานข้อมูล (RLS/Foreign Key) กรุณาคัดลอกไฟล์ "supabase/migration_full_account_deletion.sql" ไปรันใน Supabase Dashboard -> SQL Editor เพื่อเปิดใช้งานการลบบัญชีแบบสมบูรณ์',
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('Error in /api/admin/delete-user:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ในการลบบัญชีผู้ใช้',
      },
      { status: 500 }
    );
  }
}
