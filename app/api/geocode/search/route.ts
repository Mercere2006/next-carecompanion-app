import { NextRequest, NextResponse } from 'next/server';
import { searchThaiPlaces, normalizeThaiQuery, ThaiPlace } from '@/lib/thaiPlaces';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // 1. Search local curated places with high priority
  const localResults = searchThaiPlaces(q, 8);

  // 2. If query length >= 2, also query Nominatim in parallel for broader results
  let externalResults: ThaiPlace[] = [];
  if (q.length >= 2) {
    try {
      const cleanQ = normalizeThaiQuery(q);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleanQ
      )}&format=jsonv2&addressdetails=1&limit=6&countrycodes=th&accept-language=th`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CareCompanionApp/1.0 (https://carecompanion.local)',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          externalResults = data.map((item: any) => {
            const displayNameParts = (item.display_name || '').split(',');
            const placeName = item.name || displayNameParts[0]?.trim() || '';
            const address = displayNameParts.slice(0, 4).map((s: string) => s.trim()).join(', ');

            return {
              name: placeName,
              address: address || item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              category: 'ทั่วไป' as const,
            };
          });
        }
      }
    } catch (err) {
      console.warn('External geocode search failed:', err);
    }
  }

  // 3. Merge & Deduplicate results (prefer local curated places)
  const combined: ThaiPlace[] = [...localResults];
  const seen = new Set(localResults.map((p) => p.name.toLowerCase()));

  for (const ext of externalResults) {
    const key = ext.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(ext);
    }
  }

  return NextResponse.json({ results: combined.slice(0, 10) });
}
