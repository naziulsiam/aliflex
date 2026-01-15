import ytdl from 'ytdl-core';

// Add agent with cookies
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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Fetching URL:', url);

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Use better options to avoid bot detection
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

    const videoDetails = info.videoDetails;

    return res.status(200).json({
      title: videoDetails.title,
      platform: 'YouTube',
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      duration: formatDuration(parseInt(videoDetails.lengthSeconds)),
      author: videoDetails.author.name,
      formats: {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'm4a']
      },
      qualities: ['lowest', 'medium', 'highest', 'original']
    });

  } catch (error) {
    console.error('Error:', error.message);
    
    // Better error messages
    if (error.message.includes('Sign in')) {
      return res.status(403).json({ 
        error: 'YouTube blocked the request',
        message: 'YouTube is requiring sign-in. This video may be age-restricted or have other limitations.',
        suggestion: 'Try a different video or use the alternative method below.'
      });
    }

    return res.status(500).json({ 
      error: 'Failed to fetch video info',
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
