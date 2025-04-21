import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IoCheckmarkCircle, IoEllipsisHorizontal, IoCloseCircleOutline } from 'react-icons/io5'
import { useAppContext } from '../context/AppContext'
import WeatherInfo from './WeatherInfo'
import TimeInfo from './TimeInfo'

function DestinationCard({ destination, onClick }) {
  const { toggleVisited, deleteDestination } = useAppContext()
  const [showOptions, setShowOptions] = useState(false)
  const [showWeather, setShowWeather] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptions && !event.target.closest('.options-menu')) {
        setShowOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOptions])

  const handleToggleVisited = (e) => {
    e.stopPropagation()
    toggleVisited(destination.id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this destination?')) {
      deleteDestination(destination.id)
    }
    setShowOptions(false)
  }

  const handleToggleOptions = (e) => {
    e.stopPropagation()
    setShowOptions(!showOptions)
  }

  const handleToggleWeather = (e) => {
    e.stopPropagation()
    setShowWeather(!showWeather)
  }

  // Display placeholder if no image
  const imageUrl = destination.imageUrl || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={destination.city || destination.country}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-xl font-display font-medium">{destination.city}</h3>
            <p className="text-sm opacity-90">{destination.country}</p>
          </div>
        </div>
        
        {/* Visited badge */}
        {destination.visited && (
          <div className="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <IoCheckmarkCircle className="mr-1" />
            Visited
          </div>
        )}
        
        {/* Options button */}
        <button 
          className="absolute top-3 right-3 bg-white bg-opacity-80 hover:bg-opacity-100 text-neutral-700 p-1.5 rounded-full transition-colors"
          onClick={handleToggleOptions}
          aria-label="Show options"
        >
          <IoEllipsisHorizontal />
        </button>
        
        {/* Options menu */}
        {showOptions && (
          <div className="absolute top-12 right-3 bg-white rounded-lg shadow-lg z-10 py-1 options-menu">
            <button
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
              onClick={handleToggleVisited}
            >
              {destination.visited ? 'Mark as Not Visited' : 'Mark as Visited'}
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Tags */}
        {destination.tags && destination.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {destination.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Description */}
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
          {destination.description || 'No description provided.'}
        </p>
        
        {/* Weather and time section */}
        <div className="border-t border-neutral-100 pt-3 mt-2">
          <button
            onClick={handleToggleWeather}
            className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
          >
            {showWeather ? 'Hide weather & time' : 'Show weather & time'}
          </button>
          
          {showWeather && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {destination.lat && destination.lng && (
                <>
                  <WeatherInfo lat={destination.lat} lng={destination.lng} />
                  <TimeInfo lat={destination.lat} lng={destination.lng} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default DestinationCard