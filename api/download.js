const ytdl = require('ytdl-core');

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

  const { url, format, quality } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

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
        filter: 'audioonly'
      };
    } else {
      ytdlOptions = {
        quality: selectedQuality,
        filter: format === 'mp4' ? 'audioandvideo' : undefined
      };
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : `video/${format}`);

    // Stream the video
    const stream = ytdl(url, ytdlOptions);
    
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Error downloading video:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to download video',
        message: error.message 
      });
    }
  }
}
