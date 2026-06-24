import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const STREAM_URL = 'http://162.19.255.233:8080/play/UNbAl57p9hXZClOu56FCTf_5weWAERKDgrt9JpvlAiI/m3u8';

  try {
    // Fetch the raw MPEG-TS stream from the source IP
    const response = await fetch(STREAM_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    // Return the stream body directly, keeping the connection open
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in streaming proxy:', error);
    return new Response('Unable to connect to stream', { status: 502 });
  }
}
