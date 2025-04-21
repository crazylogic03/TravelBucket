import { useState, useEffect } from 'react'
import axios from 'axios'
import { IoTimeOutline } from 'react-icons/io5'

function TimeInfo({ lat, lng }) {
  const [time, setTime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchTime = async () => {
      if (!lat || !lng) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Using WorldTimeAPI
        const response = await axios.get(`https://worldtimeapi.org/api/timezone/Etc/UTC`)
        
        // Since WorldTimeAPI doesn't accept coordinates, we need to calculate the time ourselves
        // First get UTC time
        const utcDate = new Date(response.data.datetime)
        
        // Then calculate local time based on longitude (approximate)
        // Each 15 degrees of longitude = 1 hour time difference
        const hourOffset = Math.round(lng / 15)
        const localDate = new Date(utcDate.getTime() + hourOffset * 60 * 60 * 1000)
        
        setTime({
          time: localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: localDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          timezone: `UTC${hourOffset >= 0 ? '+' : ''}${hourOffset}`
        })
      } catch (err) {
        console.error('Error fetching time:', err)
        setError('Could not load time data')
        
        // Fallback: just use browser's time with approximate timezone
        const now = new Date()
        const hourOffset = Math.round(lng / 15)
        const localDate = new Date(now.getTime() + (hourOffset * 60 * 60 * 1000))
        
        setTime({
          time: localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: localDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          timezone: `UTC${hourOffset >= 0 ? '+' : ''}${hourOffset}`,
          isApproximate: true
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchTime()
    
    // Update time every minute
    const interval = setInterval(fetchTime, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [lat, lng])

  if (loading) {
    return (
      <div className="text-center py-2">
        <div className="animate-pulse h-6 w-16 bg-neutral-200 rounded mx-auto mb-2"></div>
        <div className="animate-pulse h-4 w-24 bg-neutral-200 rounded mx-auto"></div>
      </div>
    )
  }
  
  if (error && !time) {
    return <p className="text-xs text-neutral-500 text-center">{error}</p>
  }
  
  if (!time) {
    return <p className="text-xs text-neutral-500 text-center">No time data available</p>
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-1">
        <IoTimeOutline className="text-xl text-neutral-400" />
      </div>
      <div className="text-lg font-medium text-neutral-800">{time.time}</div>
      <div className="text-xs text-neutral-600">{time.date}</div>
      <div className="text-xs text-neutral-500 mt-1">
        {time.timezone}
        {time.isApproximate && ' (Approximate)'}
      </div>
    </div>
  )
}

export default TimeInfo