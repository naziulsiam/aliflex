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

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url, { agent });

    // Get direct download URL
    let selectedFormat;
    if (format === 'mp3' || format === 'm4a') {
      selectedFormat = ytdl.chooseFormat(info.formats, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
    } else {
      const qualityMap = {
        'lowest': 'lowest',
        'medium': '18',
        'highest': 'highestvideo',
        'original': 'highestvideo'
      };
      selectedFormat = ytdl.chooseFormat(info.formats, { 
        quality: qualityMap[quality] || 'highest'
      });
    }

    return res.status(200).json({
      downloadUrl: selectedFormat.url,
      title: info.videoDetails.title,
      expires: 'This URL expires in 6 hours'
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to get download URL',
      message: error.message 
    });
  }
}
