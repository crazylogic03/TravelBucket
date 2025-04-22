// App.js
import { useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'
import MapView from './components/MapView'
import DestinationList from './components/DestinationList'
import AddDestinationForm from './components/AddDestinationForm'
import ProgressStats from './components/ProgressStats'
import { useAppContext } from './context/AppContext'
import Footer from './components/Footer' // Import Footer Component

function App() {
  const { destinations } = useAppContext()
  const [activeView, setActiveView] = useState('list') // 'list', 'map', 'add'
  const [selectedDestination, setSelectedDestination] = useState(null)

  const handleViewChange = (view) => {
    setActiveView(view)
  }

  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination)
    if (activeView !== 'map') {
      setActiveView('map')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Navbar activeView={activeView} onViewChange={handleViewChange} />

      <main className="flex-grow container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {activeView === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <div className="mb-6">
              <ProgressStats />
            </div>
            <DestinationList onSelect={handleDestinationSelect} />
          </motion.div>
        )}

        {activeView === 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-[80vh]"
          >
            <MapView
              destinations={destinations}
              selectedDestination={selectedDestination}
              onSelect={setSelectedDestination}
            />
          </motion.div>
        )}

        {activeView === 'add' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AddDestinationForm
              onSuccess={() => setActiveView('list')}
            />
          </motion.div>
        )}
      </main>

      {/* Add the Footer here to appear at the bottom */}
      <Footer />
    </div>
  )
}

export default App
