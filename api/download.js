import ytdl from 'ytdl-core';

const agent = ytdl.createAgent(undefined, {
  localAddress: undefined
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, format, quality } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Download request:', { url, format, quality });

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info first
    const info = await ytdl.getInfo(url, {
      agent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-us,en;q=0.5',
          'Sec-Fetch-Mode': 'navigate'
        }
      }
    });

    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '_').substring(0, 50);

    // Quality mapping
    const qualityMap = {
      'lowest': 'lowestvideo',
      'medium': '18', // 360p
      'highest': 'highestvideo',
      'original': 'highestvideo'
    };

    let ytdlOptions;
    let contentType;

    if (format === 'mp3' || format === 'm4a') {
      // Audio only
      ytdlOptions = {
        quality: 'highestaudio',
        filter: 'audioonly',
        agent,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      };
      contentType = format === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    } else {
      // Video
      ytdlOptions = {
        quality: qualityMap[quality] || 'highest',
        filter: format === 'mp4' ? 'videoandaudio' : undefined,
        agent,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      };
      contentType = `video/${format}`;
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');

    console.log('Starting download stream...');

    // Create stream
    const stream = ytdl(url, ytdlOptions);

    // Handle stream events
    stream.on('error', (error) => {
      console.error('Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Download stream failed',
          message: error.message 
        });
      }
    });

    stream.on('end', () => {
      console.log('Download stream completed');
    });

    // Pipe to response
    stream.pipe(res);

  } catch (error) {
    console.error('Download error:', error.message);
    console.error('Stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to download video',
        message: error.message,
        details: 'The video might be restricted or the format is not available.'
      });
    }
  }
}
