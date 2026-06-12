import { NextRequest, NextResponse } from 'next/server';

// iptv-org main index playlist (all channels). For country-specific lists,
// use https://iptv-org.github.io/iptv/countries/{code}.m3u
const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export const revalidate = 3600; // re-fetch hourly

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');

  const url = country
    ? `https://iptv-org.github.io/iptv/countries/${country.toLowerCase()}.m3u`
    : DEFAULT_PLAYLIST_URL;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'AliFlex/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
