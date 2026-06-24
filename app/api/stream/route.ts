import { NextRequest } from 'next/server';
import { EventEmitter } from 'events';

export const dynamic = 'force-dynamic';

// Global shared variables persisting in memory during Render's Node.js lifecycle
let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
const streamEmitter = new EventEmitter();
streamEmitter.setMaxListeners(100); // Allow up to 100 concurrent streams

let activeViewers = 0;

function startSharedStream() {
  if (activeReader) return; // Connection already active

  const STREAM_URL = 'http://162.19.255.233:8080/play/UNbAl57p9hXZClOu56FCTf_5weWAERKDgrt9JpvlAiI/m3u8';
  console.log('Opening single shared connection to IPTV stream...');

  fetch(STREAM_URL, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })
    .then((res) => {
      if (!res.body) throw new Error('Empty response body from stream');
      activeReader = res.body.getReader();

      async function read() {
        if (!activeReader) return;
        try {
          const { done, value } = await activeReader.read();
          if (done) {
            console.log('IPTV stream completed.');
            cleanup();
            return;
          }
          // Broadcast chunk to all connected clients
          streamEmitter.emit('data', value);
          read();
        } catch (err) {
          console.error('Error reading IPTV stream:', err);
          cleanup();
        }
      }

      read();
    })
    .catch((err) => {
      console.error('Failed to connect to IPTV stream:', err);
      cleanup();
    });
}

function cleanup() {
  if (activeReader) {
    try {
      activeReader.cancel().catch(() => {});
    } catch (e) {}
    activeReader = null;
  }
  streamEmitter.emit('end');
}

export async function GET(req: NextRequest) {
  activeViewers++;
  startSharedStream();

  const customStream = new ReadableStream({
    start(controller) {
      const onData = (chunk: Uint8Array) => {
        try {
          controller.enqueue(chunk);
        } catch (e) {
          cleanupClient();
        }
      };

      const onEnd = () => {
        try {
          controller.close();
        } catch (e) {}
        cleanupClient();
      };

      streamEmitter.on('data', onData);
      streamEmitter.on('end', onEnd);

      // Clean up when client closes/disconnects tab
      req.signal.addEventListener('abort', () => {
        cleanupClient();
      });

      function cleanupClient() {
        streamEmitter.off('data', onData);
        streamEmitter.off('end', onEnd);
        
        // Decrement viewers and close base connection if no one is left
        activeViewers = Math.max(0, activeViewers - 1);
        if (activeViewers === 0 && activeReader) {
          console.log('All clients disconnected. Closing shared connection.');
          cleanup();
        }
      }
    }
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
