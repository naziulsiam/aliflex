const ytdl = require('@distube/ytdl-core');

export default async function handler(req, res) {
  // Enable CORS
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

    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    });

    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '_').substring(0, 100);

    // Quality mapping
    const qualityMap = {
      'lowest': 'lowest',
      'medium': 'highestaudio',
      'highest': 'highestvideo',
      'original': 'highestvideo'
    };

    let selectedQuality = qualityMap[quality] || 'highest';

    // Format-specific options
    let ytdlOptions;
    if (format === 'mp3' || format === 'm4a') {
      ytdlOptions = {
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      };
    } else {
      ytdlOptions = {
        quality: selectedQuality,
        filter: format === 'mp4' ? 'audioandvideo' : undefined,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      };
    }

    // Set response headers
    const contentType = format === 'mp3' ? 'audio/mpeg' : 
                       format === 'm4a' ? 'audio/mp4' :
                       `video/${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
    res.setHeader('Content-Type', contentType);

    console.log('Starting download stream for:', title);

    // Stream the video
    const stream = ytdl(url, ytdlOptions);
    
    stream.on('error', (error) => {
      console.error('Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download stream failed', message: error.message });
      }
    });

    stream.on('info', (info, format) => {
      console.log('Download started:', format.quality);
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Download error:', error.message);
    console.error('Stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to download video',
        message: error.message,
        details: 'The video might be age-restricted, private, or region-locked.'
      });
    }
  }
}
