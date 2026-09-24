import { NextRequest, NextResponse } from 'next/server';

interface NominatimAddress {
  amenity?: string;
  building?: string;
  shop?: string;
  tourism?: string;
  office?: string;
  road?: string;
  street?: string;
  quarter?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  district?: string;
  city?: string;
  province?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
}

function formatThaiAddress(data: NominatimResponse): string {
  if (!data) return '';
  const addr = data.address || {};
  const placeName =
    data.name ||
    addr.amenity ||
    addr.building ||
    addr.shop ||
    addr.tourism ||
    addr.office ||
    '';

  const road = addr.road || addr.street || '';
  const subDistrict = addr.quarter || addr.suburb || addr.neighbourhood || '';
  const district =
    addr.city_district ||
    addr.district ||
    (addr.suburb && addr.suburb.includes('เขต') ? addr.suburb : '') ||
    '';
  const province = addr.city || addr.province || addr.state || '';

  const parts: string[] = [];
  if (placeName && !road.includes(placeName)) {
    parts.push(placeName);
  }
  if (road) parts.push(road);
  if (subDistrict && subDistrict !== placeName) parts.push(subDistrict);
  if (district && district !== subDistrict) parts.push(district);
  if (province && !district.includes(province)) parts.push(province);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (data.display_name) {
    return data.display_name
      .split(',')
      .slice(0, 4)
      .map((s) => s.trim())
      .join(', ');
  }

  return '';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and Longitude are required' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  // 1. Try OpenStreetMap Nominatim with Thai language and custom User-Agent
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=th`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'CareCompanionApp/1.0 (https://carecompanion.local)',
      },
    });

    if (res.ok) {
      const data: NominatimResponse = await res.json();
      const formatted = formatThaiAddress(data);
      if (formatted) {
        return NextResponse.json({
          address: formatted,
          raw: data,
          source: 'nominatim',
        });
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding failed:', err);
  }

  // 2. Fallback to BigDataCloud (free client/server reverse geocoding in Thai)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=th`;
    const res = await fetch(bdcUrl);

    if (res.ok) {
      const data = await res.json();
      const district = data.localityInfo?.administrative?.find(
        (a: { description?: string; name: string }) =>
          a.description?.includes('เขต') ||
          a.name?.includes('เขต') ||
          a.name?.includes('อำเภอ')
      )?.name || data.localityInfo?.administrative?.[3]?.name;

      const parts = [
        data.locality,
        district,
        data.city || data.principalSubdivision,
      ].filter(Boolean);

      if (parts.length > 0) {
        return NextResponse.json({
          address: parts.join(', '),
          source: 'bigdatacloud',
        });
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocoding failed:', err);
  }

  // 3. Fallback: if geocoding completely unavailable, return formatted coordinates with prefix
  return NextResponse.json({
    address: `พิกัดปัจจุบัน (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    source: 'coordinates',
  });
}
