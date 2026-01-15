import youtubedl from 'youtube-dl-exec';

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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Fetching with youtube-dl:', url);

    // Get video info using youtube-dl
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0'
      ]
    });

    return res.status(200).json({
      title: info.title,
      platform: 'YouTube',
      thumbnail: info.thumbnail,
      duration: formatDuration(info.duration || 0),
      author: info.uploader || 'Unknown',
      formats: {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'm4a']
      },
      qualities: ['lowest', 'medium', 'highest', 'original']
    });

  } catch (error) {
    console.error('Error with youtube-dl:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch video info',
      message: error.message 
    });
  }
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
