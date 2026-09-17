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
          .single();

        // If user specified a role during login and doesn't have one set yet
        if (requestedRole && (!profile || profile.role === 'customer') && requestedRole === 'companion') {
          await supabase
            .from('profiles')
            .update({ role: 'companion' })
            .eq('id', user.id);
          
          await supabase
            .from('companion_profiles')
            .upsert({ id: user.id, verification_status: 'pending' });

          return NextResponse.redirect(`${origin}/companion/profile`);
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
