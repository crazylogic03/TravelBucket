import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IoEarthOutline, IoListOutline, IoAddOutline } from 'react-icons/io5'

function Navbar({ activeView, onViewChange }) {
  const [scrolled, setScrolled] = useState(false)
  
  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])
  
  return (
    <header 
      className={`sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <IoEarthOutline className="text-primary-500 text-3xl mr-2" />
            </motion.div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl font-display font-bold text-neutral-900"
            >
              Travel <span className="text-primary-500">Bucket List</span>
            </motion.h1>
          </div>
          
          <nav className="flex justify-center md:justify-end">
            <ul className="flex bg-neutral-100 rounded-lg p-1 shadow-sm">
              <li>
                <button
                  onClick={() => onViewChange('list')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    activeView === 'list' 
                      ? 'bg-white text-primary-500 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <IoListOutline className="mr-1" />
                  <span>List</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onViewChange('map')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    activeView === 'map' 
                      ? 'bg-white text-primary-500 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <IoEarthOutline className="mr-1" />
                  <span>Map</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onViewChange('add')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    activeView === 'add' 
                      ? 'bg-white text-primary-500 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <IoAddOutline className="mr-1" />
                  <span>Add</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar