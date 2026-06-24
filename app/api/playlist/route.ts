import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_M3U = `#EXTM3U

#EXTINF:-1 tvg-id="caze-tv" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/cazetv.png" group-title="Live Sports" tvg-country="BR",Caze TV BR (1080p)
https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8

#EXTINF:-1 tvg-id="real-madrid-tv" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/realmadridtv.png" group-title="Live Sports" tvg-country="ES",Real Madrid TV
https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8

#EXTINF:-1 tvg-id="bein-sport-extra" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/beinsports.png" group-title="Live Sports" tvg-country="US",beIN SPORT EXTRA Ñ (1080p)
https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8

#EXTINF:-1 tvg-id="dazn-combat" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/dazn.png" group-title="Live Sports" tvg-country="UK",DAZN Combat
https://dazn-combat-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-dazn-combat-rakuten/CDN/master.m3u8

#EXTINF:-1 tvg-id="red-bull-tv" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/redbulltv.png" group-title="Live Sports" tvg-country="AT",Red Bull TV
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8

#EXTINF:-1 tvg-id="tvri-sport-hd" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/tvrisport.png" group-title="Live Sports" tvg-country="ID",TVRI Sport HD
https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD-avc1_1500000=10003-mp4a_96000=20002.m3u8

#EXTINF:-1 tvg-id="fight-network" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/fightnetwork.png" group-title="Live Sports" tvg-country="CA",FIGHT NETWORK
https://amg00966-amg00966c10-amgplt0201.playout.now3.amagi.tv/playlist/amg00966-amg00966c10-amgplt0201/playlist.m3u8

#EXTINF:-1 tvg-id="gopro-tv" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/gopro.png" group-title="Live Sports" tvg-country="US",GoPro TV
https://3a1b4d927c02473b806350cc162d271f.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-891-GOPRO-FREELIVESPORTS/mt/freelivesports/891/hls/master/playlist.m3u8

#EXTINF:-1 tvg-id="cricket-gold" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/cricket.png" group-title="Live Sports" tvg-country="IN",Cricket Gold
https://d1nj4u39ja4cn0.cloudfront.net/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/FLS-MuxIP-CricketGold/418.m3u8

#EXTINF:-1 tvg-id="fuel-tv" tvg-logo="https://raw.githubusercontent.com/iptv-org/logos/master/channels/fueltv.png" group-title="Live Sports" tvg-country="EU",FUEL TV
https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01074-fueltv-fueltvemeaen-sportstribal/playlist.m3u8`;

export const revalidate = 1800; // Cache for 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistUrl = searchParams.get('url');

  if (!playlistUrl) {
    return new NextResponse(DEFAULT_M3U, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  try {
    const res = await fetch(playlistUrl, {
      next: { revalidate: 1800 },
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
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch external playlist' },
      { status: 500 }
    );
  }
}

