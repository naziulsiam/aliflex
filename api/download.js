import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, format, quality } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '_');

    const qualityMap = {
      'lowest': 'lowest',
      'medium': 'highestaudio',
      'highest': 'highestvideo',
      'original': 'highestvideo'
    };

    let ytdlOptions;
    if (format === 'mp3' || format === 'm4a') {
      ytdlOptions = {
        quality: 'highestaudio',
        filter: 'audioonly'
      };
    } else {
      ytdlOptions = {
        quality: qualityMap[quality] || 'highest',
        filter: 'audioandvideo'
      };
    }

    res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : `video/${format}`);

    const stream = ytdl(url, ytdlOptions);
    stream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Download failed',
        message: error.message 
      });
    }
  }
}
