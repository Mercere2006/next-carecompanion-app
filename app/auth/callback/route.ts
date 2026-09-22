import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedRole = searchParams.get('role'); // e.g. 'customer' | 'companion'
  const next = searchParams.get('next') ?? '/';

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
          .select('id_card_image_url')
          .eq('id', user.id)
          .maybeSingle();

        const isGoogleAvatar = (url?: string | null) =>
          Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));

        // Preserve uploaded avatar if available, otherwise use Google OAuth avatar
        let finalAvatar: string | null = null;
        if (profile?.avatar_url && !isGoogleAvatar(profile.avatar_url)) {
          finalAvatar = profile.avatar_url;
        } else if (compProfile?.id_card_image_url) {
          finalAvatar = compProfile.id_card_image_url;
        } else {
          finalAvatar =
            profile?.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;
        }

        // Determine user role: prioritize existing admin, requestedRole, fallback to existing or 'customer'
        const determinedRole =
          profile?.role === 'admin'
            ? 'admin'
            : requestedRole === 'companion'
            ? 'companion'
            : profile?.role || 'customer';

        // Preserve customized full_name if available; Admin account name is strictly 'Admin'
        let finalFullName: string | null = null;
        if (determinedRole === 'admin') {
          finalFullName = 'Admin';
        } else {
          finalFullName =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null;
        }

        // Always ensure profiles row exists in Supabase for this user
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

        if (determinedRole === 'companion') {
          // Check if companion profile already exists before inserting
          const { data: existingComp } = await supabase
            .from('companion_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!existingComp) {
            await supabase
              .from('companion_profiles')
              .insert({
                id: user.id,
                verification_status: 'pending',
                is_available: false,
                hourly_rate: 0,
              });
          }

          if (requestedRole === 'companion' && (!next || next === '/')) {
            return NextResponse.redirect(`${origin}/companion/profile`);
          }
        }

        if (next && next !== '/' && next !== '/customer/dashboard' && next !== '/companion/dashboard') {
          return NextResponse.redirect(`${origin}${next}`);
        }

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`);
        }

        // Default: Redirect to companions directory so the user sees other companions immediately
        return NextResponse.redirect(`${origin}/companions`);
      }
      return NextResponse.redirect(`${origin}/companions`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth-error=true`);
}
