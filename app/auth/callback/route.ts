import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeNextUrl(next: string | null): string | null {
  if (!next) return null;
  // Ensure it's a relative path starting with / and not // (prevents open-redirect attacks)
  if (next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedRole = searchParams.get('role'); // e.g. 'customer' | 'companion'
  const next = searchParams.get('next');
  const safeNext = getSafeNextUrl(next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check existing profile and companion profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const { data: compProfile } = await supabase
          .from('companion_profiles')
          .select('id, verification_status')
          .eq('id', user.id)
          .maybeSingle();

        const googleAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        const googleFullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          null;

        // If profile row was deleted or does not exist:
        // Clear everything, wipe orphaned companion data, use strictly Google OAuth metadata
        if (!profile) {
          if (compProfile) {
            await supabase.from('companion_profiles').delete().eq('id', user.id);
          }

          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email || '',
            full_name: googleFullName,
            role: 'customer',
            avatar_url: googleAvatar,
            phone: null,
            emergency_phone: null,
            updated_at: new Date().toISOString(),
          });

          // If a specific next destination was requested (e.g. companion page), return there!
          if (safeNext && safeNext !== '/') {
            return NextResponse.redirect(`${origin}${safeNext}`);
          }
          return NextResponse.redirect(`${origin}/`);
        }

        // For existing profile: use saved avatar_url or fall back to Google OAuth avatar (NEVER pull companion ID card)
        const finalAvatar = profile.avatar_url || googleAvatar;

        // Determine user role:
        // 1. Admin remains admin
        // 2. Verified companion remains companion
        // 3. All other users (new sign-ins, unverified/pending/rejected companions) are strictly 'customer'
        let determinedRole: 'admin' | 'companion' | 'customer' = 'customer';
        if (profile.role === 'admin') {
          determinedRole = 'admin';
        } else if (profile.role === 'companion' && compProfile?.verification_status === 'verified') {
          determinedRole = 'companion';
        } else {
          determinedRole = 'customer';
        }

        // Preserve customized full_name if available; Admin account name is strictly 'Admin'
        let finalFullName: string | null = null;
        if (determinedRole === 'admin') {
          finalFullName = 'Admin';
        } else {
          finalFullName = profile.full_name || googleFullName;
        }

        // Always ensure profiles row is synchronized in Supabase for this user
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            full_name: finalFullName,
            role: determinedRole,
            avatar_url: finalAvatar,
            updated_at: new Date().toISOString(),
          });

        if (determinedRole === 'admin') {
          return NextResponse.redirect(`${origin}/admin`);
        }

        if (determinedRole === 'companion') {
          if (requestedRole === 'companion' && (!safeNext || safeNext === '/')) {
            return NextResponse.redirect(`${origin}/companion/profile`);
          }
          if (safeNext && safeNext !== '/' && safeNext !== '/customer/dashboard' && safeNext !== '/companion/dashboard') {
            return NextResponse.redirect(`${origin}${safeNext}`);
          }
          return NextResponse.redirect(`${origin}/`);
        }

        // Customer role: If user requested a destination (e.g. companion page), return there!
        if (safeNext && safeNext !== '/') {
          return NextResponse.redirect(`${origin}${safeNext}`);
        }

        // Default: Return to home page (หน้าแรก)
        return NextResponse.redirect(`${origin}/`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth-error=true`);
}
