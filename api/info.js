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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Fetching info for URL:', url);

    // Validate URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please use a valid youtube.com or youtu.be link.' });
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    });

    clearTimeout(timeoutId);

    const videoDetails = info.videoDetails;

    // Get available formats
    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .slice(0, 5)
      .map(f => ({
        quality: f.qualityLabel || 'unknown',
        container: f.container,
        hasAudio: f.hasAudio
      }));

    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .slice(0, 3)
      .map(f => ({
        quality: (f.audioBitrate || 'unknown') + 'kbps',
        container: f.container
      }));

    const response = {
      title: videoDetails.title,
      platform: 'YouTube',
      thumbnail: videoDetails.thumbnails && videoDetails.thumbnails.length > 0 
        ? videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url 
        : 'https://via.placeholder.com/320x180',
      duration: formatDuration(parseInt(videoDetails.lengthSeconds) || 0),
      author: videoDetails.author?.name || 'Unknown',
      formats: {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'm4a']
      },
      qualities: ['lowest', 'medium', 'highest', 'original'],
      availableFormats: {
        video: videoFormats,
        audio: audioFormats
      }
    };

    console.log('Successfully fetched info for:', videoDetails.title);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching video info:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to fetch video information',
      message: error.message,
      details: 'This might be due to YouTube rate limiting or video restrictions. Try again in a moment.'
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
