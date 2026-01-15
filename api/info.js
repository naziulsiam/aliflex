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

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Get available formats
    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .map(f => ({
        quality: f.qualityLabel,
        container: f.container,
        hasAudio: f.hasAudio
      }));

    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .map(f => ({
        quality: f.audioBitrate + 'kbps',
        container: f.container
      }));

    res.status(200).json({
      title: videoDetails.title,
      platform: 'YouTube',
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      duration: formatDuration(videoDetails.lengthSeconds),
      author: videoDetails.author.name,
      formats: {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'm4a']
      },
      qualities: ['lowest', 'medium', 'highest', 'original'],
      availableFormats: {
        video: videoFormats.slice(0, 5),
        audio: audioFormats.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video information',
      message: error.message 
    });
  }
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
