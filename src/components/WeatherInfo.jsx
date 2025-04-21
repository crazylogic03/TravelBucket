import { useState, useEffect } from 'react'
import axios from 'axios'
import { IoCloudOutline, IoWaterOutline, IoThermometerOutline } from 'react-icons/io5'

function WeatherInfo({ lat, lng }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lng) return
      
      setLoading(true)
      setError(null)
      
      try {
        // OpenWeatherMap free API
        const apiKey = '4a88a81f0a0e7f63574aa57710b01c30' // This is a demo key with limited requests
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
        
        const response = await axios.get(url)
        setWeather({
          temp: Math.round(response.data.main.temp),
          humidity: response.data.main.humidity,
          condition: response.data.weather[0].main,
          description: response.data.weather[0].description,
          icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}.png`,
        })
      } catch (err) {
        console.error('Error fetching weather:', err)
        setError('Could not load weather data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchWeather()
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [lat, lng])

  if (loading) {
    return (
      <div className="text-center py-2">
        <div className="animate-pulse h-4 w-24 bg-neutral-200 rounded mx-auto mb-2"></div>
        <div className="animate-pulse h-6 w-16 bg-neutral-200 rounded mx-auto"></div>
      </div>
    )
  }
  
  if (error) {
    return <p className="text-xs text-neutral-500 text-center">{error}</p>
  }
  
  if (!weather) {
    return <p className="text-xs text-neutral-500 text-center">No weather data available</p>
  }

  return (
    <div className="text-center">
      {weather.icon && (
        <img 
          src={weather.icon} 
          alt={weather.description}
          className="w-12 h-12 mx-auto" 
        />
      )}
      <div className="text-lg font-medium text-neutral-800">{weather.temp}°C</div>
      <div className="text-xs text-neutral-600 capitalize">{weather.description}</div>
      
      <div className="flex justify-center mt-2 text-xs text-neutral-500 space-x-3">
        <div className="flex items-center">
          <IoWaterOutline className="mr-1" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  )
}

export default WeatherInfo