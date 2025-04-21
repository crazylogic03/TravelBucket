import axios from 'axios'

// Note: Using a demo API key with limited requests
// In production, use environment variables or server-side proxying
const UNSPLASH_ACCESS_KEY = 'demo123456789'

export const fetchUnsplashImage = async (query) => {
  try {
    // For demo, return a predefined image based on query
    // In production, replace with actual Unsplash API call
    
    // Simple mock based on query terms
    const searchTerm = query.toLowerCase()
    
    if (searchTerm.includes('beach') || searchTerm.includes('hawaii') || searchTerm.includes('bali')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('mountain') || searchTerm.includes('alps') || searchTerm.includes('hiking')) {
      return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('city') || searchTerm.includes('york') || searchTerm.includes('tokyo')) {
      return 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('paris') || searchTerm.includes('france')) {
      return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('rome') || searchTerm.includes('italy')) {
      return 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('london') || searchTerm.includes('england')) {
      return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('japan') || searchTerm.includes('kyoto')) {
      return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('australia') || searchTerm.includes('sydney')) {
      return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    if (searchTerm.includes('canyon') || searchTerm.includes('desert')) {
      return 'https://images.unsplash.com/photo-1527319154240-37e71a16b1c7?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    }
    
    // Default travel image
    return 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
    
    /* In a real implementation with Unsplash API:
    
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })
    
    if (response.data.results.length > 0) {
      return response.data.results[0].urls.regular
    }
    
    return null
    */
    
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error)
    return null
  }
}