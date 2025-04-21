import { motion } from 'framer-motion'
import { 
  IoEarthOutline, 
  IoCheckmarkCircleOutline, 
  IoLocationOutline, 
  IoTimeOutline 
} from 'react-icons/io5'
import { useAppContext } from '../context/AppContext'

function ProgressStats() {
  const { getProgressStats, getUniqueCountriesCount, destinations } = useAppContext()
  const { total, visited, percentage } = getProgressStats()
  const uniqueCountries = getUniqueCountriesCount()
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
  
  if (total === 0) {
    return null
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="bg-white rounded-xl shadow-card p-6 mb-6"
    >
      <h2 className="text-xl font-display font-medium text-neutral-800 mb-4">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          variants={itemVariants}
          className="bg-neutral-50 rounded-lg p-4 flex items-center"
        >
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mr-3">
            <IoEarthOutline className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Total Destinations</p>
            <p className="text-xl font-medium text-neutral-800">{total}</p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-neutral-50 rounded-lg p-4 flex items-center"
        >
          <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500 mr-3">
            <IoCheckmarkCircleOutline className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Places Visited</p>
            <p className="text-xl font-medium text-neutral-800">{visited}</p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-neutral-50 rounded-lg p-4 flex items-center"
        >
          <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-500 mr-3">
            <IoTimeOutline className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Completion</p>
            <p className="text-xl font-medium text-neutral-800">{percentage}%</p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-neutral-50 rounded-lg p-4 flex items-center"
        >
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mr-3">
            <IoLocationOutline className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Countries</p>
            <p className="text-xl font-medium text-neutral-800">{uniqueCountries}</p>
          </div>
        </motion.div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-neutral-600 mb-2">
          <span>{visited} visited</span>
          <span>{total - visited} remaining</span>
        </div>
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
          ></motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProgressStats