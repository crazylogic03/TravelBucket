import { useState, useEffect } from 'react'
import { IoTimeOutline } from 'react-icons/io5'

function TimeInfo() {
  const [time, setTime] = useState(null)

  useEffect(() => {
    const updateISTTime = () => {
      const now = new Date()

      const timeString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const dateString = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short'
      })

      setTime({
        time: timeString,
        date: dateString,
        timezone: 'IST (UTC+5:30)'
      })
    }

    updateISTTime()
    const interval = setInterval(updateISTTime, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return (
      <div className="text-center py-2">
        <div className="animate-pulse h-6 w-16 bg-neutral-200 rounded mx-auto mb-2"></div>
        <div className="animate-pulse h-4 w-24 bg-neutral-200 rounded mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-1">
        <IoTimeOutline className="text-xl text-neutral-400" />
      </div>
      <div className="text-lg font-medium text-neutral-800">{time.time}</div>
      <div className="text-xs text-neutral-600">{time.date}</div>
      <div className="text-xs text-neutral-500 mt-1">{time.timezone}</div>
    </div>
  )
}

export default TimeInfo
