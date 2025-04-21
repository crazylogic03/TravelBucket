import { motion } from 'framer-motion'
import { IoCloseOutline, IoCheckmarkCircle, IoTimeOutline, IoCloudOutline } from 'react-icons/io5'
import { useAppContext } from '../context/AppContext'
import WeatherInfo from './WeatherInfo'
import TimeInfo from './TimeInfo'

function DestinationDetail({ destination, onClose }) {
  const { toggleVisited } = useAppContext()
  
  const handleToggleVisited = () => {
    toggleVisited(destination.id)
  }
  
  // Set a default image if none is provided
  const imageUrl = destination.imageUrl || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* Header with image */}
      <div className="relative h-48">
        <img 
          src={imageUrl} 
          alt={destination.city || destination.country}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-2xl font-display font-medium">{destination.city}</h2>
            <p className="text-sm opacity-90">{destination.country}</p>
          </div>
        </div>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 bg-white bg-opacity-80 hover:bg-opacity-100 text-neutral-700 p-1.5 rounded-full transition-colors"
          aria-label="Close details"
        >
          <IoCloseOutline className="text-xl" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-grow overflow-auto">
        {/* Visited status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${destination.visited ? 'bg-secondary-500' : 'bg-primary-500'}`}></span>
            <span className="text-sm font-medium">
              {destination.visited ? 'Visited' : 'Not visited yet'}
            </span>
          </div>
          <button
            onClick={handleToggleVisited}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              destination.visited 
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700' 
                : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700'
            }`}
          >
            {destination.visited ? 'Mark as not visited' : 'Mark as visited'}
          </button>
        </div>
        
        {/* Tags */}
        {destination.tags && destination.tags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {destination.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Description */}
        {destination.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Description</h3>
            <p className="text-sm text-neutral-600">
              {destination.description}
            </p>
          </div>
        )}
        
        {/* Why visit */}
        {destination.whyVisit && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Why it's on my list</h3>
            <p className="text-sm text-neutral-600">
              {destination.whyVisit}
            </p>
          </div>
        )}
        
        {/* Weather and time */}
        {destination.lat && destination.lng && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <IoCloudOutline className="text-primary-500 mr-1" />
                  <h3 className="text-sm font-medium text-neutral-700">Weather</h3>
                </div>
                <WeatherInfo lat={destination.lat} lng={destination.lng} />
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <IoTimeOutline className="text-primary-500 mr-1" />
                  <h3 className="text-sm font-medium text-neutral-700">Local Time</h3>
                </div>
                <TimeInfo lat={destination.lat} lng={destination.lng} />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default DestinationDetail