export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }

    const { url } = body;

    console.log('Received request for URL:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Import ytdl-core here to catch import errors
    let ytdl;
    try {
      ytdl = require('@distube/ytdl-core');
    } catch (importError) {
      console.error('Failed to import ytdl-core:', importError);
      // Fallback: return mock data for testing
      return res.status(200).json({
        title: 'Test Video - ytdl-core not available',
        platform: 'YouTube',
        thumbnail: 'https://via.placeholder.com/320x180/6366f1/ffffff?text=YouTube',
        duration: '5:23',
        author: 'Test Author',
        formats: {
          video: ['mp4', 'webm'],
          audio: ['mp3', 'm4a']
        },
        qualities: ['lowest', 'medium', 'highest', 'original'],
        note: 'This is test data. Install ytdl-core for real functionality.'
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    console.log('Fetching video info...');

    // Fetch with timeout
    const info = await Promise.race([
      ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      )
    ]);

    console.log('Video info fetched successfully');

    const videoDetails = info.videoDetails;

    const response = {
      title: videoDetails.title || 'Unknown Title',
      platform: 'YouTube',
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || 'https://via.placeholder.com/320x180',
      duration: formatDuration(parseInt(videoDetails.lengthSeconds) || 0),
      author: videoDetails.author?.name || 'Unknown',
      formats: {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'm4a']
      },
      qualities: ['lowest', 'medium', 'highest', 'original']
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in /api/info:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to fetch video information',
      message: error.message,
      details: 'Please check the URL and try again. Some videos may be restricted.'
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
