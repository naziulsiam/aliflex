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

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Use RapidAPI YouTube MP3 Downloader
    const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'YOUR_API_KEY_HERE',
        'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
      }
    });

    const data = await response.json();

    if (data.status === 'ok') {
      return res.status(200).json({
        title: data.title,
        platform: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        duration: formatDuration(data.duration || 0),
        author: data.author || 'Unknown',
        formats: {
          video: ['mp4'],
          audio: ['mp3']
        },
        qualities: ['medium', 'highest'],
        videoId: videoId,
        downloadLinks: {
          mp3: data.link,
          mp4: `https://www.youtube.com/watch?v=${videoId}` // Will use different API for video
        }
      });
    } else {
      throw new Error('Failed to fetch video info');
    }

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch video info',
      message: error.message 
    });
  }
}

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
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
