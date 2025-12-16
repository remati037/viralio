// Function to get YouTube thumbnail from URL
export function getYoutubeThumbnail(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  const videoId = match && match[2].length === 11 ? match[2] : null

  if (videoId) {
    return {
      url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      type: 'youtube',
    }
  }
  return { url: null, type: 'link' }
}

// Function to parse profile details from URL and name
export function parseProfileDetails(url: string, name: string) {
  let iconUrl = `https://placehold.co/40x40/4f46e5/FFFFFF?text=${name.substring(0, 2).toUpperCase()}`
  let nicheId = 'marketing'

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    iconUrl = 'https://placehold.co/40x40/FF0000/FFFFFF?text=YT'
  } else if (url.includes('instagram.com')) {
    iconUrl = 'https://placehold.co/40x40/C13584/FFFFFF?text=IG'
  } else if (url.includes('tiktok.com')) {
    iconUrl = 'https://placehold.co/40x40/000000/FFFFFF?text=TK'
  }

  if (name.toLowerCase().includes('nekretnine') || name.toLowerCase().includes('real estate')) {
    nicheId = 'realestate'
  } else if (name.toLowerCase().includes('fitness') || name.toLowerCase().includes('zdravlje')) {
    nicheId = 'fitness'
  }

  return {
    icon: iconUrl,
    niche: nicheId,
  }
}

