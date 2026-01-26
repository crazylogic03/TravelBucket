// App.js
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import MapView from './components/MapView'
import DestinationList from './components/DestinationList'
import AddDestinationForm from './components/AddDestinationForm'
import ProgressStats from './components/ProgressStats'
import { useAppContext } from './context/AppContext'
import Footer from './components/Footer'
import SplashScreen from './components/SplashScreen'

function App() {
  const { destinations } = useAppContext()
  const [activeView, setActiveView] = useState('list') // 'list', 'map', 'add'
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [showSplash, setShowSplash] = useState(true)

  const handleViewChange = (view) => {
    setActiveView(view)
  }

  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination)
    if (activeView !== 'map') {
      setActiveView('map')
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 relative">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      <div className={`flex flex-col flex-grow min-h-screen transition-all duration-500 ${showSplash ? 'blur-sm overflow-hidden h-screen' : ''}`}>
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
    </div>
  )
}

export default App
