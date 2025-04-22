import axios from 'axios'

const UNSPLASH_ACCESS_KEY = 'oLHTeOpJrMWyDOdAhft1oLn2eI5cbTO05U8YR76H_fc'

export const fetchUnsplashImage = async (query) => {
  try {
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${oLHTeOpJrMWyDOdAhft1oLn2eI5cbTO05U8YR76H_fc}`
      }
    })

    if (response.data.results.length > 0) {
      return response.data.results[0].urls.regular
    }

    return null
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error)
    return null
  }
}
