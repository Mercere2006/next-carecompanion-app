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
        // Check existing profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        // Determine user role: prioritize requestedRole, fallback to existing or 'customer'
        const determinedRole =
          requestedRole === 'companion'
            ? 'companion'
            : profile?.role || 'customer';

        // Always ensure profiles row exists in Supabase for this user
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            role: determinedRole,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            updated_at: new Date().toISOString(),
          });

        if (determinedRole === 'companion') {
          await supabase
            .from('companion_profiles')
            .upsert({ id: user.id, verification_status: 'pending' });

          if (requestedRole === 'companion' && (!next || next === '/')) {
            return NextResponse.redirect(`${origin}/companion/profile`);
          }
        }

        if (next && next !== '/') {
          return NextResponse.redirect(`${origin}${next}`);
        }

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`);
        } else if (profile?.role === 'companion') {
          return NextResponse.redirect(`${origin}/companion/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/customer/dashboard`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth-error=true`);
}
