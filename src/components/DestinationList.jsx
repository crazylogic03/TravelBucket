import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import DestinationCard from './DestinationCard'
import { useNavigate } from 'react-router-dom';

function DestinationList({ onSelect }) {
  const { destinations, isLoading, setCurrentView } = useAppContext()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-card p-8 text-center"
      >
        <h2 className="text-2xl font-display font-medium text-neutral-800 mb-4">Your bucket list is empty</h2>
        <p className="text-neutral-600 mb-6">Add your dream destinations to start planning your adventures!</p>

      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {destinations.map((destination, index) => (
        <motion.div
          key={destination.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <DestinationCard
            destination={destination}
            onClick={() => onSelect(destination)}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default DestinationList
