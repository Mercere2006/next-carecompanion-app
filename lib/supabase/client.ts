import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Clean URL and Key (strip quotes, spaces, and accidental /rest/v1 suffix)
  const supabaseUrl = rawUrl
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/rest\/v1\/?$/, '');

  const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, '');

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
